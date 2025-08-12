import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { createCategory } from '../handlers/create_category';
import { eq } from 'drizzle-orm';

// Test input with all fields
const testInput: CreateCategoryInput = {
  name: 'Electronics',
  description: 'Electronic devices and gadgets'
};

// Test input with minimal fields
const minimalInput: CreateCategoryInput = {
  name: 'Books'
};

describe('createCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a category with all fields', async () => {
    const result = await createCategory(testInput);

    // Basic field validation
    expect(result.name).toEqual('Electronics');
    expect(result.description).toEqual('Electronic devices and gadgets');
    expect(result.id).toBeDefined();
    expect(result.id).toBeTypeOf('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a category with minimal fields', async () => {
    const result = await createCategory(minimalInput);

    // Basic field validation
    expect(result.name).toEqual('Books');
    expect(result.description).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.id).toBeTypeOf('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save category to database', async () => {
    const result = await createCategory(testInput);

    // Query using proper drizzle syntax
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Electronics');
    expect(categories[0].description).toEqual('Electronic devices and gadgets');
    expect(categories[0].created_at).toBeInstanceOf(Date);
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should enforce unique category names', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create another category with same name
    await expect(createCategory(testInput)).rejects.toThrow(/duplicate key value violates unique constraint/i);
  });

  it('should handle categories with same name but different case sensitivity', async () => {
    // Create first category
    await createCategory(testInput);

    // Try to create another category with different case - should fail due to unique constraint
    const duplicateInput: CreateCategoryInput = {
      name: 'electronics', // lowercase
      description: 'Different description'
    };

    // Note: PostgreSQL unique constraints are case-sensitive by default
    // This should succeed unless there's a custom constraint
    const result = await createCategory(duplicateInput);
    expect(result.name).toEqual('electronics');
  });

  it('should create multiple categories with different names', async () => {
    // Create first category
    const result1 = await createCategory(testInput);

    // Create second category with different name
    const secondInput: CreateCategoryInput = {
      name: 'Clothing',
      description: 'Apparel and accessories'
    };
    const result2 = await createCategory(secondInput);

    // Verify both categories exist
    expect(result1.name).toEqual('Electronics');
    expect(result2.name).toEqual('Clothing');
    expect(result1.id).not.toEqual(result2.id);

    // Verify in database
    const allCategories = await db.select()
      .from(categoriesTable)
      .execute();

    expect(allCategories).toHaveLength(2);
    expect(allCategories.map(c => c.name)).toContain('Electronics');
    expect(allCategories.map(c => c.name)).toContain('Clothing');
  });

  it('should handle empty description as null', async () => {
    const inputWithUndefinedDescription: CreateCategoryInput = {
      name: 'Test Category'
      // description is undefined
    };

    const result = await createCategory(inputWithUndefinedDescription);

    expect(result.name).toEqual('Test Category');
    expect(result.description).toBeNull();

    // Verify in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, result.id))
      .execute();

    expect(categories[0].description).toBeNull();
  });
});