import { db } from '../db';
import { categoriesTable } from '../db/schema';
import { type UpdateCategoryInput, type Category } from '../schema';
import { eq, and, ne, SQL } from 'drizzle-orm';

export const updateCategory = async (input: UpdateCategoryInput): Promise<Category> => {
  try {
    // Check if category exists
    const existingCategory = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.id))
      .execute();

    if (existingCategory.length === 0) {
      throw new Error(`Category with id ${input.id} not found`);
    }

    // Build conditions array for validation and update
    const conditions: SQL<unknown>[] = [];
    
    // If name is being updated, check for uniqueness
    if (input.name !== undefined) {
      const nameCheckResult = await db.select()
        .from(categoriesTable)
        .where(and(
          eq(categoriesTable.name, input.name),
          ne(categoriesTable.id, input.id)
        ))
        .execute();

      if (nameCheckResult.length > 0) {
        throw new Error(`Category with name "${input.name}" already exists`);
      }
    }

    // Build update object with only defined fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.description !== undefined) {
      updateData.description = input.description;
    }

    // Perform the update
    const result = await db.update(categoriesTable)
      .set(updateData)
      .where(eq(categoriesTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Category update failed:', error);
    throw error;
  }
};