import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput } from '../schema';
import { updateCategory } from '../handlers/update_category';
import { eq } from 'drizzle-orm';

// Test data
const testCategory = {
  name: 'Original Category',
  description: 'Original description'
};

const anotherCategory = {
  name: 'Another Category',
  description: 'Another description'
};

describe('updateCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update category name and description', async () => {
    // Create test category
    const [created] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'Updated Category',
      description: 'Updated description'
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Category');
    expect(result.description).toEqual('Updated description');
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(created.updated_at.getTime());
  });

  it('should update only name when description not provided', async () => {
    // Create test category
    const [created] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'Updated Name Only'
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Name Only');
    expect(result.description).toEqual(testCategory.description);
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only description when name not provided', async () => {
    // Create test category
    const [created] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const updateInput: UpdateCategoryInput = {
      id: created.id,
      description: 'Updated description only'
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual(testCategory.name);
    expect(result.description).toEqual('Updated description only');
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set description to null when explicitly provided', async () => {
    // Create test category
    const [created] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const updateInput: UpdateCategoryInput = {
      id: created.id,
      description: null
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual(testCategory.name);
    expect(result.description).toBeNull();
    expect(result.created_at).toEqual(created.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create test category
    const [created] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'Verified Update',
      description: 'Verified description'
    };

    await updateCategory(updateInput);

    // Verify changes in database
    const categories = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, created.id))
      .execute();

    expect(categories).toHaveLength(1);
    expect(categories[0].name).toEqual('Verified Update');
    expect(categories[0].description).toEqual('Verified description');
    expect(categories[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when category does not exist', async () => {
    const updateInput: UpdateCategoryInput = {
      id: 999,
      name: 'Non-existent Category'
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/Category with id 999 not found/i);
  });

  it('should throw error when name conflicts with existing category', async () => {
    // Create two test categories
    const [category1] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const [category2] = await db.insert(categoriesTable)
      .values(anotherCategory)
      .returning()
      .execute();

    // Try to update category2 with category1's name
    const updateInput: UpdateCategoryInput = {
      id: category2.id,
      name: testCategory.name
    };

    await expect(updateCategory(updateInput)).rejects.toThrow(/Category with name "Original Category" already exists/i);
  });

  it('should allow updating category with same name (no change)', async () => {
    // Create test category
    const [created] = await db.insert(categoriesTable)
      .values(testCategory)
      .returning()
      .execute();

    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: testCategory.name,
      description: 'Updated description with same name'
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual(testCategory.name);
    expect(result.description).toEqual('Updated description with same name');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle categories with null descriptions', async () => {
    // Create category with null description
    const categoryData = {
      name: 'Null Description Category',
      description: null
    };

    const [created] = await db.insert(categoriesTable)
      .values(categoryData)
      .returning()
      .execute();

    const updateInput: UpdateCategoryInput = {
      id: created.id,
      name: 'Updated Null Category'
    };

    const result = await updateCategory(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.name).toEqual('Updated Null Category');
    expect(result.description).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });
});