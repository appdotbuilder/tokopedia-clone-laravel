import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { deleteCategory } from '../handlers/delete_category';
import { eq } from 'drizzle-orm';

describe('deleteCategory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a category successfully', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Delete the category
    const result = await deleteCategory(categoryId);
    expect(result).toBe(true);

    // Verify category was deleted
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(deletedCategory).toHaveLength(0);
  });

  it('should throw error when category does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteCategory(nonExistentId))
      .rejects.toThrow(/Category with id 999 not found/i);
  });

  it('should throw error when category has associated products', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create products associated with this category
    await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          code: 'LAP001',
          description: 'Gaming laptop',
          price: '999.99',
          stock: 10,
          category_id: categoryId
        },
        {
          name: 'Mouse',
          code: 'MOU001',
          description: 'Wireless mouse',
          price: '29.99',
          stock: 50,
          category_id: categoryId
        }
      ])
      .execute();

    // Attempt to delete the category
    await expect(deleteCategory(categoryId))
      .rejects.toThrow(/Cannot delete category with id \d+\. It has 2 associated products/i);

    // Verify category still exists
    const categoryStillExists = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, categoryId))
      .execute();

    expect(categoryStillExists).toHaveLength(1);
  });

  it('should delete category with no associated products', async () => {
    // Create two categories
    const [category1Result, category2Result] = await Promise.all([
      db.insert(categoriesTable)
        .values({
          name: 'Books',
          description: 'Books and literature'
        })
        .returning()
        .execute(),
      db.insert(categoriesTable)
        .values({
          name: 'Electronics',
          description: 'Electronic products'
        })
        .returning()
        .execute()
    ]);

    const booksId = category1Result[0].id;
    const electronicsId = category2Result[0].id;

    // Create product only for electronics category
    await db.insert(productsTable)
      .values({
        name: 'Smartphone',
        code: 'PHONE001',
        description: 'Latest smartphone',
        price: '699.99',
        stock: 20,
        category_id: electronicsId
      })
      .execute();

    // Should be able to delete Books category (no products)
    const result = await deleteCategory(booksId);
    expect(result).toBe(true);

    // Verify Books category was deleted
    const deletedCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, booksId))
      .execute();
    expect(deletedCategory).toHaveLength(0);

    // Verify Electronics category still exists
    const remainingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, electronicsId))
      .execute();
    expect(remainingCategory).toHaveLength(1);

    // Should not be able to delete Electronics category (has products)
    await expect(deleteCategory(electronicsId))
      .rejects.toThrow(/Cannot delete category with id \d+\. It has 1 associated products/i);
  });

  it('should handle multiple deletion attempts on same category', async () => {
    // Create a test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Temporary Category',
        description: 'Will be deleted'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // First deletion should succeed
    const firstResult = await deleteCategory(categoryId);
    expect(firstResult).toBe(true);

    // Second deletion should fail
    await expect(deleteCategory(categoryId))
      .rejects.toThrow(/Category with id \d+ not found/i);
  });
});