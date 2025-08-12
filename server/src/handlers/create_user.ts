import { db } from '../db';
import { usersTable } from '../db/schema';
import { createUserInputSchema, type CreateUserInput, type User } from '../schema';
import { eq, sql } from 'drizzle-orm';

export const createUser = async (rawInput: any): Promise<User> => {
  try {
    // Parse and validate input, applying defaults
    const input = createUserInputSchema.parse(rawInput);
    // Check if email already exists (case-insensitive)
    const existingUser = await db.select()
      .from(usersTable)
      .where(sql`LOWER(${usersTable.email}) = LOWER(${input.email})`)
      .limit(1)
      .execute();

    if (existingUser.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Hash the password using Bun's built-in password hashing
    const hashedPassword = await Bun.password.hash(input.password);

    // Insert new user
    const result = await db.insert(usersTable)
      .values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: input.role || 'Customer',
        address: input.address || null,
        phone: input.phone || null
      })
      .returning()
      .execute();

    const user = result[0];
    return {
      ...user,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  } catch (error) {
    console.error('User creation failed:', error);
    throw error;
  }
};