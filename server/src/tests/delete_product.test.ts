import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable, cartItemsTable, orderItemsTable, ordersTable, usersTable } from '../db/schema';
import { deleteProduct } from '../handlers/delete_product';
import { eq } from 'drizzle-orm';

describe('deleteProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a product successfully', async () => {
    // Create a test category first
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category description'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create a test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '19.99',
        stock: 100,
        category_id: categoryId,
        image: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result).toBe(true);

    // Verify product is deleted from database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent product', async () => {
    const result = await deleteProduct(999);

    expect(result).toBe(false);
  });

  it('should delete product and remove associated cart items', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer',
        address: null,
        phone: null
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category description'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '19.99',
        stock: 100,
        category_id: categoryId,
        image: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Add product to cart
    await db.insert(cartItemsTable)
      .values({
        user_id: userId,
        product_id: productId,
        quantity: 2
      })
      .execute();

    // Verify cart item exists before deletion
    const cartItemsBefore = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, productId))
      .execute();

    expect(cartItemsBefore).toHaveLength(1);

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result).toBe(true);

    // Verify product is deleted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(0);

    // Verify cart items are also deleted
    const cartItemsAfter = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, productId))
      .execute();

    expect(cartItemsAfter).toHaveLength(0);
  });

  it('should throw error when product is referenced in orders', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer',
        address: 'Test Address',
        phone: '1234567890'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category description'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '19.99',
        stock: 100,
        category_id: categoryId,
        image: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Create an order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '39.98',
        status: 'completed',
        shipping_address: 'Test Address',
        shipping_method: 'Standard',
        shipping_cost: '5.00',
        payment_method: 'Credit Card',
        payment_status: 'paid'
      })
      .returning()
      .execute();

    const orderId = orderResult[0].id;

    // Add product to order items
    await db.insert(orderItemsTable)
      .values({
        order_id: orderId,
        product_id: productId,
        quantity: 2,
        price: '19.99'
      })
      .execute();

    // Attempt to delete the product should throw error
    await expect(deleteProduct(productId)).rejects.toThrow(/cannot delete product.*referenced in existing orders/i);

    // Verify product still exists
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);
  });

  it('should handle product with both cart items and order references correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer',
        address: 'Test Address',
        phone: '1234567890'
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category description'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '19.99',
        stock: 100,
        category_id: categoryId,
        image: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Add product to cart
    await db.insert(cartItemsTable)
      .values({
        user_id: userId,
        product_id: productId,
        quantity: 1
      })
      .execute();

    // Create an order and add product to order items
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '19.99',
        status: 'completed',
        shipping_address: 'Test Address',
        shipping_method: 'Standard',
        shipping_cost: '5.00',
        payment_method: 'Credit Card',
        payment_status: 'paid'
      })
      .returning()
      .execute();

    await db.insert(orderItemsTable)
      .values({
        order_id: orderResult[0].id,
        product_id: productId,
        quantity: 1,
        price: '19.99'
      })
      .execute();

    // Attempt to delete should fail due to order reference
    await expect(deleteProduct(productId)).rejects.toThrow(/cannot delete product.*referenced in existing orders/i);

    // Verify product still exists
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(1);

    // Cart items should still exist since deletion failed
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, productId))
      .execute();

    expect(cartItems).toHaveLength(1);
  });

  it('should handle product with multiple cart items from different users', async () => {
    // Create test users
    const user1Result = await db.insert(usersTable)
      .values({
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'password123',
        role: 'Customer',
        address: null,
        phone: null
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123',
        role: 'Customer',
        address: null,
        phone: null
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category description'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '19.99',
        stock: 100,
        category_id: categoryId,
        image: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Add product to both users' carts
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: user1Id,
          product_id: productId,
          quantity: 2
        },
        {
          user_id: user2Id,
          product_id: productId,
          quantity: 3
        }
      ])
      .execute();

    // Verify both cart items exist
    const cartItemsBefore = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, productId))
      .execute();

    expect(cartItemsBefore).toHaveLength(2);

    // Delete the product
    const result = await deleteProduct(productId);

    expect(result).toBe(true);

    // Verify product is deleted
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    expect(products).toHaveLength(0);

    // Verify all cart items are deleted
    const cartItemsAfter = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, productId))
      .execute();

    expect(cartItemsAfter).toHaveLength(0);
  });
});