import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { removeFromCart } from '../handlers/remove_from_cart';
import { eq } from 'drizzle-orm';

describe('removeFromCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove existing cart item and return true', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();

    const [category] = await db.insert(categoriesTable).values({
      name: 'Electronics',
      description: 'Electronic products'
    }).returning().execute();

    const [product] = await db.insert(productsTable).values({
      name: 'Test Product',
      code: 'TEST-001',
      description: 'A test product',
      price: '29.99',
      stock: 50,
      category_id: category.id
    }).returning().execute();

    const [cartItem] = await db.insert(cartItemsTable).values({
      user_id: user.id,
      product_id: product.id,
      quantity: 2
    }).returning().execute();

    // Remove the cart item
    const result = await removeFromCart(cartItem.id);

    // Should return true
    expect(result).toBe(true);

    // Verify item is deleted from database
    const remainingItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem.id))
      .execute();

    expect(remainingItems).toHaveLength(0);
  });

  it('should return false when cart item does not exist', async () => {
    const nonExistentId = 99999;

    const result = await removeFromCart(nonExistentId);

    // Should return false for non-existent item
    expect(result).toBe(false);
  });

  it('should not affect other cart items when removing one', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();

    const [category] = await db.insert(categoriesTable).values({
      name: 'Electronics',
      description: 'Electronic products'
    }).returning().execute();

    const [product1] = await db.insert(productsTable).values({
      name: 'Test Product 1',
      code: 'TEST-001',
      description: 'A test product',
      price: '29.99',
      stock: 50,
      category_id: category.id
    }).returning().execute();

    const [product2] = await db.insert(productsTable).values({
      name: 'Test Product 2',
      code: 'TEST-002',
      description: 'Another test product',
      price: '39.99',
      stock: 30,
      category_id: category.id
    }).returning().execute();

    // Create two cart items
    const [cartItem1] = await db.insert(cartItemsTable).values({
      user_id: user.id,
      product_id: product1.id,
      quantity: 1
    }).returning().execute();

    const [cartItem2] = await db.insert(cartItemsTable).values({
      user_id: user.id,
      product_id: product2.id,
      quantity: 3
    }).returning().execute();

    // Remove first cart item
    const result = await removeFromCart(cartItem1.id);

    expect(result).toBe(true);

    // Verify first item is deleted
    const deletedItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem1.id))
      .execute();

    expect(deletedItems).toHaveLength(0);

    // Verify second item still exists
    const remainingItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem2.id))
      .execute();

    expect(remainingItems).toHaveLength(1);
    expect(remainingItems[0].quantity).toBe(3);
    expect(remainingItems[0].product_id).toBe(product2.id);
  });

  it('should handle multiple users cart items correctly', async () => {
    // Create two users
    const [user1] = await db.insert(usersTable).values({
      name: 'User One',
      email: 'user1@example.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();

    const [user2] = await db.insert(usersTable).values({
      name: 'User Two',
      email: 'user2@example.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();

    const [category] = await db.insert(categoriesTable).values({
      name: 'Books',
      description: 'Book products'
    }).returning().execute();

    const [product] = await db.insert(productsTable).values({
      name: 'Test Book',
      code: 'BOOK-001',
      description: 'A test book',
      price: '19.99',
      stock: 100,
      category_id: category.id
    }).returning().execute();

    // Create cart items for both users with same product
    const [cartItem1] = await db.insert(cartItemsTable).values({
      user_id: user1.id,
      product_id: product.id,
      quantity: 2
    }).returning().execute();

    const [cartItem2] = await db.insert(cartItemsTable).values({
      user_id: user2.id,
      product_id: product.id,
      quantity: 1
    }).returning().execute();

    // Remove user1's cart item
    const result = await removeFromCart(cartItem1.id);

    expect(result).toBe(true);

    // Verify user1's item is deleted
    const user1Items = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem1.id))
      .execute();

    expect(user1Items).toHaveLength(0);

    // Verify user2's item still exists
    const user2Items = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItem2.id))
      .execute();

    expect(user2Items).toHaveLength(1);
    expect(user2Items[0].user_id).toBe(user2.id);
    expect(user2Items[0].quantity).toBe(1);
  });
});