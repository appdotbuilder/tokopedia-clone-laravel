import { type User } from '../schema';

export async function getUsers(): Promise<User[]> {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is fetching all users from the database.
    // Should exclude password field from returned data for security.
    // Only accessible by Admin users.
    return [];
}