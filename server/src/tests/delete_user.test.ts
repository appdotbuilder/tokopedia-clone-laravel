import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, cartItemsTable, categoriesTable, productsTable } from '../db/schema';
import { deleteUser } from '../handlers/delete_user';
import { eq } from 'drizzle-orm';

describe('deleteUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing user', async () => {
    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Customer',
        address: '123 Main St',
        phone: '555-1234'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Delete the user
    const result = await deleteUser(userId);

    expect(result).toBe(true);

    // Verify user was deleted from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should return false when user does not exist', async () => {
    // Try to delete a non-existent user
    const result = await deleteUser(999);

    expect(result).toBe(false);
  });

  it('should clean up related cart items when deleting user', async () => {
    // Create test category and product first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '19.99',
        stock: 100,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Create a test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Add items to user's cart
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: userId,
          product_id: productResult[0].id,
          quantity: 2
        },
        {
          user_id: userId,
          product_id: productResult[0].id,
          quantity: 1
        }
      ])
      .execute();

    // Verify cart items exist before deletion
    const cartItemsBefore = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, userId))
      .execute();

    expect(cartItemsBefore).toHaveLength(2);

    // Delete the user
    const result = await deleteUser(userId);

    expect(result).toBe(true);

    // Verify cart items were also deleted
    const cartItemsAfter = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, userId))
      .execute();

    expect(cartItemsAfter).toHaveLength(0);

    // Verify user was deleted
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should delete admin user successfully', async () => {
    // Create an admin user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'Admin'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Delete the admin user
    const result = await deleteUser(userId);

    expect(result).toBe(true);

    // Verify user was deleted from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should handle user with no cart items', async () => {
    // Create a test user without any cart items
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Simple User',
        email: 'simple@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Delete the user
    const result = await deleteUser(userId);

    expect(result).toBe(true);

    // Verify user was deleted from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(users).toHaveLength(0);
  });

  it('should only delete the specified user and their cart items', async () => {
    // Create test category and product
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '19.99',
        stock: 100,
        category_id: categoryResult[0].id
      })
      .returning()
      .execute();

    // Create two test users
    const userResults = await db.insert(usersTable)
      .values([
        {
          name: 'User One',
          email: 'user1@example.com',
          password: 'password123',
          role: 'Customer'
        },
        {
          name: 'User Two',
          email: 'user2@example.com',
          password: 'password123',
          role: 'Customer'
        }
      ])
      .returning()
      .execute();

    const userId1 = userResults[0].id;
    const userId2 = userResults[1].id;

    // Add cart items for both users
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: userId1,
          product_id: productResult[0].id,
          quantity: 1
        },
        {
          user_id: userId2,
          product_id: productResult[0].id,
          quantity: 2
        }
      ])
      .execute();

    // Delete only the first user
    const result = await deleteUser(userId1);

    expect(result).toBe(true);

    // Verify first user and their cart items were deleted
    const user1 = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId1))
      .execute();

    const cartItems1 = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, userId1))
      .execute();

    expect(user1).toHaveLength(0);
    expect(cartItems1).toHaveLength(0);

    // Verify second user and their cart items still exist
    const user2 = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId2))
      .execute();

    const cartItems2 = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, userId2))
      .execute();

    expect(user2).toHaveLength(1);
    expect(cartItems2).toHaveLength(1);
  });
});