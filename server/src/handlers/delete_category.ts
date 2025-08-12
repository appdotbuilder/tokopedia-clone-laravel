import { db } from '../db';
import { categoriesTable, productsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteCategory(id: number): Promise<boolean> {
  try {
    // First, check if the category exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with id ${id} not found`);
    }

    // Check if category has associated products
    const associatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.category_id, id))
      .execute();

    if (associatedProducts.length > 0) {
      throw new Error(`Cannot delete category with id ${id}. It has ${associatedProducts.length} associated products. Please reassign or delete the products first.`);
    }

    // Delete the category
    const result = await db.delete(categoriesTable)
      .where(eq(categoriesTable.id, id))
      .execute();

    return true;
  } catch (error) {
    console.error('Category deletion failed:', error);
    throw error;
  }
}