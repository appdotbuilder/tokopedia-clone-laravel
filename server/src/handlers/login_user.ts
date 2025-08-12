import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput, type User } from '../schema';
import { eq } from 'drizzle-orm';

export const loginUser = async (input: LoginInput): Promise<User | null> => {
  try {
    // Find user by email
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.email, input.email))
      .execute();

    if (users.length === 0) {
      return null; // User not found
    }

    const user = users[0];

    // In a real implementation, you would hash the input password and compare
    // with the stored hash. For this example, we'll do a simple comparison
    // Note: This is NOT secure and should use bcrypt or similar in production
    if (user.password !== input.password) {
      return null; // Password mismatch
    }

    // Return user data without password field
    const { password, ...userWithoutPassword } = user;
    
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};