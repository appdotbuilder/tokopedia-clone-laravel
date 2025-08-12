import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type CreateCategoryInput } from '../schema';
import { getCategories } from '../handlers/get_categories';

// Test data
const testCategories: CreateCategoryInput[] = [
  {
    name: 'Electronics',
    description: 'Electronic devices and gadgets'
  },
  {
    name: 'Books',
    description: 'Physical and digital books'
  },
  {
    name: 'Clothing',
    description: null
  }
];

describe('getCategories', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no categories exist', async () => {
    const result = await getCategories();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all categories', async () => {
    // Create test categories
    await db.insert(categoriesTable)
      .values(testCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(3);
    
    // Verify all categories are present
    const categoryNames = result.map(cat => cat.name);
    expect(categoryNames).toContain('Electronics');
    expect(categoryNames).toContain('Books');
    expect(categoryNames).toContain('Clothing');
  });

  it('should return categories with correct structure', async () => {
    // Create a single test category
    await db.insert(categoriesTable)
      .values([testCategories[0]])
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];

    // Verify category structure
    expect(category.id).toBeDefined();
    expect(typeof category.id).toBe('number');
    expect(category.name).toBe('Electronics');
    expect(category.description).toBe('Electronic devices and gadgets');
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);
  });

  it('should handle categories with null descriptions', async () => {
    // Create category with null description
    await db.insert(categoriesTable)
      .values([testCategories[2]]) // Clothing with null description
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(1);
    const category = result[0];

    expect(category.name).toBe('Clothing');
    expect(category.description).toBeNull();
  });

  it('should return categories ordered by creation date (newest first)', async () => {
    // Insert categories one by one to ensure different timestamps
    await db.insert(categoriesTable)
      .values([testCategories[0]]) // Electronics first
      .execute();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await db.insert(categoriesTable)
      .values([testCategories[1]]) // Books second
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(2);
    
    // Verify ordering - newest first (Books should come before Electronics)
    expect(result[0].name).toBe('Books');
    expect(result[1].name).toBe('Electronics');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
  });

  it('should handle large number of categories', async () => {
    // Create many categories
    const manyCategories = Array.from({ length: 50 }, (_, i) => ({
      name: `Category ${i + 1}`,
      description: `Description for category ${i + 1}`
    }));

    await db.insert(categoriesTable)
      .values(manyCategories)
      .execute();

    const result = await getCategories();

    expect(result).toHaveLength(50);
    expect(result[0].name).toMatch(/^Category \d+$/);
    expect(result[0].description).toMatch(/^Description for category \d+$/);
  });

  it('should include all required fields for each category', async () => {
    await db.insert(categoriesTable)
      .values([testCategories[0]])
      .execute();

    const result = await getCategories();
    const category = result[0];

    // Verify all required fields are present
    const requiredFields = ['id', 'name', 'description', 'created_at', 'updated_at'];
    requiredFields.forEach(field => {
      expect(category).toHaveProperty(field);
    });

    // Verify field types
    expect(typeof category.id).toBe('number');
    expect(typeof category.name).toBe('string');
    expect(category.description === null || typeof category.description === 'string').toBe(true);
    expect(category.created_at).toBeInstanceOf(Date);
    expect(category.updated_at).toBeInstanceOf(Date);
  });
});