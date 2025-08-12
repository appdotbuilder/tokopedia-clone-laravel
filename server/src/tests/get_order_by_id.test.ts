import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable } from '../db/schema';
import { getOrderById } from '../handlers/get_order_by_id';

describe('getOrderById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return order for admin access (no userId)', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: user.id,
        total_amount: '199.99',
        shipping_address: '123 Main St',
        shipping_method: 'Standard',
        shipping_cost: '10.00',
        payment_method: 'Credit Card',
        payment_status: 'pending'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Test admin access (no userId provided)
    const result = await getOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(order.id);
    expect(result!.user_id).toEqual(user.id);
    expect(result!.total_amount).toEqual(199.99);
    expect(typeof result!.total_amount).toEqual('number');
    expect(result!.shipping_cost).toEqual(10.00);
    expect(typeof result!.shipping_cost).toEqual('number');
    expect(result!.status).toEqual('pending');
    expect(result!.shipping_address).toEqual('123 Main St');
    expect(result!.shipping_method).toEqual('Standard');
    expect(result!.payment_method).toEqual('Credit Card');
    expect(result!.payment_status).toEqual('pending');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return order for customer accessing their own order', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Customer User',
        email: 'customer@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create test order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: user.id,
        total_amount: '299.50',
        shipping_address: '456 Oak Ave',
        shipping_method: 'Express',
        shipping_cost: '15.99',
        payment_method: 'PayPal',
        payment_status: 'paid'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Test customer accessing their own order
    const result = await getOrderById(order.id, user.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(order.id);
    expect(result!.user_id).toEqual(user.id);
    expect(result!.total_amount).toEqual(299.50);
    expect(result!.shipping_cost).toEqual(15.99);
    expect(result!.shipping_address).toEqual('456 Oak Ave');
    expect(result!.shipping_method).toEqual('Express');
    expect(result!.payment_method).toEqual('PayPal');
    expect(result!.payment_status).toEqual('paid');
  });

  it('should return null when customer tries to access another user\'s order', async () => {
    // Create two test users
    const user1Result = await db.insert(usersTable)
      .values({
        name: 'User One',
        email: 'user1@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const user2Result = await db.insert(usersTable)
      .values({
        name: 'User Two',
        email: 'user2@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const user1 = user1Result[0];
    const user2 = user2Result[0];

    // Create order for user1
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: user1.id,
        total_amount: '150.00',
        shipping_address: '789 Pine St',
        shipping_method: 'Standard',
        shipping_cost: '5.00'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Test user2 trying to access user1's order
    const result = await getOrderById(order.id, user2.id);

    expect(result).toBeNull();
  });

  it('should return null when order does not exist', async () => {
    // Test with non-existent order ID
    const result = await getOrderById(99999);

    expect(result).toBeNull();
  });

  it('should return null when customer accesses non-existent order', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Test customer accessing non-existent order
    const result = await getOrderById(99999, user.id);

    expect(result).toBeNull();
  });

  it('should handle orders with different statuses correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create completed order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: user.id,
        total_amount: '500.75',
        status: 'completed',
        shipping_address: '321 Elm St',
        shipping_method: 'Express',
        shipping_cost: '25.00',
        payment_method: 'Credit Card',
        payment_status: 'paid'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    const result = await getOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('completed');
    expect(result!.total_amount).toEqual(500.75);
    expect(result!.shipping_cost).toEqual(25.00);
  });

  it('should handle orders with null optional fields', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const user = userResult[0];

    // Create order with null optional fields
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: user.id,
        total_amount: '99.99',
        shipping_address: '555 Maple Dr',
        shipping_method: 'Standard',
        shipping_cost: '0.00',
        payment_method: null,
        payment_status: null
      })
      .returning()
      .execute();

    const order = orderResult[0];

    const result = await getOrderById(order.id);

    expect(result).not.toBeNull();
    expect(result!.payment_method).toBeNull();
    expect(result!.payment_status).toBeNull();
    expect(result!.shipping_cost).toEqual(0);
    expect(result!.total_amount).toEqual(99.99);
  });
});