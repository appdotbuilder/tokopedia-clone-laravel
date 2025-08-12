import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type User } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateUser = async (input: UpdateUserInput): Promise<User> => {
  try {
    // Check if user exists
    const existingUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.id))
      .execute();

    if (existingUser.length === 0) {
      throw new Error('User not found');
    }

    // If email is being updated, check for uniqueness
    if (input.email) {
      const emailExists = await db.select()
        .from(usersTable)
        .where(and(
          eq(usersTable.email, input.email),
          ne(usersTable.id, input.id)
        ))
        .execute();

      if (emailExists.length > 0) {
        throw new Error('Email already exists');
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.email !== undefined) {
      updateData.email = input.email;
    }

    if (input.password !== undefined) {
      // Hash the password (using a simple hash for demonstration)
      updateData.password = await Bun.password.hash(input.password);
    }

    if (input.role !== undefined) {
      updateData.role = input.role;
    }

    if (input.address !== undefined) {
      updateData.address = input.address;
    }

    if (input.phone !== undefined) {
      updateData.phone = input.phone;
    }

    // Update user record
    const result = await db.update(usersTable)
      .set(updateData)
      .where(eq(usersTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('User update failed:', error);
    throw error;
  }
};