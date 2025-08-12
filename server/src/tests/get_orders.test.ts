import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable } from '../db/schema';
import { type OrderFilter } from '../schema';
import { getOrders } from '../handlers/get_orders';

// Test data
const testUser1 = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'Customer' as const
};

const testUser2 = {
  name: 'Jane Smith',
  email: 'jane@example.com',
  password: 'password123',
  role: 'Admin' as const
};

const testCategory = {
  name: 'Test Category',
  description: 'A test category'
};

const testProduct = {
  name: 'Test Product',
  code: 'TEST001',
  description: 'A test product',
  price: '19.99',
  stock: 100,
  category_id: 1
};

const createTestOrder = (userId: number, overrides = {}) => ({
  user_id: userId,
  total_amount: '99.99',
  status: 'pending' as const,
  shipping_address: '123 Test St',
  shipping_method: 'Standard',
  shipping_cost: '5.99',
  payment_method: 'Credit Card',
  ...overrides
});

describe('getOrders', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty result when no orders exist', async () => {
    const result = await getOrders();

    expect(result.orders).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should return all orders with proper numeric conversions', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser1).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    // Create test orders with slight delay to ensure proper ordering
    const order1 = await db.insert(ordersTable).values(
      createTestOrder(user.id, { total_amount: '99.99', shipping_cost: '5.99' })
    ).returning();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    const order2 = await db.insert(ordersTable).values(
      createTestOrder(user.id, { total_amount: '149.50', shipping_cost: '10.00' })
    ).returning();

    const result = await getOrders();

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
    
    // Verify numeric conversions
    expect(typeof result.orders[0].total_amount).toBe('number');
    expect(typeof result.orders[0].shipping_cost).toBe('number');
    expect(result.orders[0].total_amount).toBe(149.50); // Most recent first due to ordering
    expect(result.orders[0].shipping_cost).toBe(10.00);
    expect(result.orders[1].total_amount).toBe(99.99);
    expect(result.orders[1].shipping_cost).toBe(5.99);

    // Verify all required fields are present
    result.orders.forEach(order => {
      expect(order.id).toBeDefined();
      expect(order.user_id).toBe(user.id);
      expect(order.status).toBeDefined();
      expect(order.shipping_address).toBeDefined();
      expect(order.shipping_method).toBeDefined();
      expect(order.created_at).toBeInstanceOf(Date);
      expect(order.updated_at).toBeInstanceOf(Date);
    });
  });

  it('should filter orders by user_id context (customer view)', async () => {
    // Create users and prerequisite data
    const [user1] = await db.insert(usersTable).values(testUser1).returning();
    const [user2] = await db.insert(usersTable).values(testUser2).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    // Create orders for both users
    await db.insert(ordersTable).values([
      createTestOrder(user1.id, { status: 'pending' }),
      createTestOrder(user1.id, { status: 'paid' }),
      createTestOrder(user2.id, { status: 'shipped' })
    ]).returning();

    // Customer should only see their own orders
    const result = await getOrders(undefined, user1.id);

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
    result.orders.forEach(order => {
      expect(order.user_id).toBe(user1.id);
    });
  });

  it('should filter by status', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser1).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    // Create orders with different statuses
    await db.insert(ordersTable).values([
      createTestOrder(user.id, { status: 'pending' }),
      createTestOrder(user.id, { status: 'paid' }),
      createTestOrder(user.id, { status: 'pending' })
    ]).returning();

    const filter: OrderFilter = { 
      status: 'pending',
      page: 1,
      limit: 20 
    };
    const result = await getOrders(filter);

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
    result.orders.forEach(order => {
      expect(order.status).toBe('pending');
    });
  });

  it('should filter by date range', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser1).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    // Create orders
    const orders = await db.insert(ordersTable).values([
      createTestOrder(user.id),
      createTestOrder(user.id),
      createTestOrder(user.id)
    ]).returning();

    // Test filtering by start date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const filter: OrderFilter = {
      start_date: yesterday,
      end_date: tomorrow,
      page: 1,
      limit: 20
    };

    const result = await getOrders(filter);

    expect(result.orders).toHaveLength(3);
    expect(result.total).toBe(3);
    result.orders.forEach(order => {
      expect(order.created_at >= yesterday).toBe(true);
      expect(order.created_at <= tomorrow).toBe(true);
    });
  });

  it('should filter by user_id for admin view', async () => {
    // Create users and prerequisite data
    const [user1] = await db.insert(usersTable).values(testUser1).returning();
    const [user2] = await db.insert(usersTable).values(testUser2).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    // Create orders for both users
    await db.insert(ordersTable).values([
      createTestOrder(user1.id),
      createTestOrder(user1.id),
      createTestOrder(user2.id)
    ]).returning();

    // Admin filtering by specific user (no userId context provided)
    const filter: OrderFilter = { 
      user_id: user1.id,
      page: 1,
      limit: 20 
    };
    const result = await getOrders(filter);

    expect(result.orders).toHaveLength(2);
    expect(result.total).toBe(2);
    result.orders.forEach(order => {
      expect(order.user_id).toBe(user1.id);
    });
  });

  it('should handle pagination correctly', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser1).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    // Create 5 orders
    const orderData = Array.from({ length: 5 }, () => createTestOrder(user.id));
    await db.insert(ordersTable).values(orderData).returning();

    // Test first page
    const page1Filter: OrderFilter = { page: 1, limit: 2 };
    const page1Result = await getOrders(page1Filter);

    expect(page1Result.orders).toHaveLength(2);
    expect(page1Result.total).toBe(5);

    // Test second page
    const page2Filter: OrderFilter = { page: 2, limit: 2 };
    const page2Result = await getOrders(page2Filter);

    expect(page2Result.orders).toHaveLength(2);
    expect(page2Result.total).toBe(5);

    // Test third page
    const page3Filter: OrderFilter = { page: 3, limit: 2 };
    const page3Result = await getOrders(page3Filter);

    expect(page3Result.orders).toHaveLength(1);
    expect(page3Result.total).toBe(5);

    // Verify different orders are returned (by checking IDs)
    const page1Ids = new Set(page1Result.orders.map(o => o.id));
    const page2Ids = new Set(page2Result.orders.map(o => o.id));
    const page3Ids = new Set(page3Result.orders.map(o => o.id));

    // No overlap between pages
    expect([...page1Ids].some(id => page2Ids.has(id))).toBe(false);
    expect([...page2Ids].some(id => page3Ids.has(id))).toBe(false);
    expect([...page1Ids].some(id => page3Ids.has(id))).toBe(false);
  });

  it('should combine multiple filters correctly', async () => {
    // Create users and prerequisite data
    const [user1] = await db.insert(usersTable).values(testUser1).returning();
    const [user2] = await db.insert(usersTable).values(testUser2).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    // Create orders with different combinations
    await db.insert(ordersTable).values([
      createTestOrder(user1.id, { status: 'pending' }),
      createTestOrder(user1.id, { status: 'paid' }),
      createTestOrder(user2.id, { status: 'pending' }),
      createTestOrder(user2.id, { status: 'shipped' })
    ]).returning();

    // Filter by user_id and status
    const filter: OrderFilter = {
      user_id: user1.id,
      status: 'pending',
      page: 1,
      limit: 20
    };

    const result = await getOrders(filter);

    expect(result.orders).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.orders[0].user_id).toBe(user1.id);
    expect(result.orders[0].status).toBe('pending');
  });

  it('should order results by created_at descending', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser1).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    // Create orders with slight delay to ensure different timestamps
    const order1 = await db.insert(ordersTable).values(createTestOrder(user.id, { total_amount: '50.00' })).returning();
    
    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const order2 = await db.insert(ordersTable).values(createTestOrder(user.id, { total_amount: '100.00' })).returning();

    const result = await getOrders();

    expect(result.orders).toHaveLength(2);
    // Most recent should be first
    expect(result.orders[0].total_amount).toBe(100.00);
    expect(result.orders[1].total_amount).toBe(50.00);
    expect(result.orders[0].created_at >= result.orders[1].created_at).toBe(true);
  });

  it('should handle empty filters gracefully', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values(testUser1).returning();
    await db.insert(categoriesTable).values(testCategory).returning();
    await db.insert(productsTable).values(testProduct).returning();

    await db.insert(ordersTable).values(createTestOrder(user.id)).returning();

    // Test with empty filter object
    const result = await getOrders({ page: 1, limit: 20 });

    expect(result.orders).toHaveLength(1);
    expect(result.total).toBe(1);
  });
});