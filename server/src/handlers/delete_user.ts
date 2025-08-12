import { db } from '../db';
import { usersTable, cartItemsTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export const deleteUser = async (id: number): Promise<boolean> => {
  try {
    // First, delete related cart items (cascade cleanup)
    await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.user_id, id))
      .execute();

    // Delete the user record
    const result = await db.delete(usersTable)
      .where(eq(usersTable.id, id))
      .returning()
      .execute();

    // Return true if user was successfully deleted, false if user not found
    return result.length > 0;
  } catch (error) {
    console.error('User deletion failed:', error);
    throw error;
  }
};