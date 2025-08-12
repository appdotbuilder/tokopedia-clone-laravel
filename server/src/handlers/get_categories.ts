import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type Category } from '../schema';
import { desc } from 'drizzle-orm';

export const getCategories = async (): Promise<Category[]> => {
  try {
    // Fetch all categories ordered by most recently created first
    const results = await db.select()
      .from(categoriesTable)
      .orderBy(desc(categoriesTable.created_at))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    throw error;
  }
};