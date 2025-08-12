import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats when database is empty', async () => {
    const stats = await getDashboardStats();

    expect(stats.total_users).toBe(0);
    expect(stats.total_products).toBe(0);
    expect(stats.total_orders).toBe(0);
    expect(stats.total_revenue).toBe(0);
    expect(stats.pending_orders).toBe(0);
    expect(stats.low_stock_products).toBe(0);
    expect(stats.recent_orders).toHaveLength(0);
    expect(stats.top_selling_products).toHaveLength(0);
  });

  it('should calculate basic counts correctly', async () => {
    // Create test users
    await db.insert(usersTable).values([
      {
        name: 'User 1',
        email: 'user1@test.com',
        password: 'password123',
        role: 'Customer'
      },
      {
        name: 'User 2',
        email: 'user2@test.com',
        password: 'password123',
        role: 'Admin'
      }
    ]).execute();

    // Create test category
    const categoryResult = await db.insert(categoriesTable).values({
      name: 'Test Category',
      description: 'Test category description'
    }).returning().execute();
    const category_id = categoryResult[0].id;

    // Create test products
    await db.insert(productsTable).values([
      {
        name: 'Product 1',
        code: 'P001',
        description: 'Product 1 description',
        price: '19.99',
        stock: 100,
        category_id
      },
      {
        name: 'Product 2',
        code: 'P002',
        description: 'Product 2 description',
        price: '29.99',
        stock: 5, // Low stock
        category_id
      },
      {
        name: 'Product 3',
        code: 'P003',
        description: 'Product 3 description',
        price: '39.99',
        stock: 0, // No stock
        category_id
      }
    ]).execute();

    const stats = await getDashboardStats();

    expect(stats.total_users).toBe(2);
    expect(stats.total_products).toBe(3);
    expect(stats.low_stock_products).toBe(2); // Products with stock <= 10
  });

  it('should calculate order statistics correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable).values({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();
    const user_id = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable).values({
      name: 'Test Category',
      description: 'Test category description'
    }).returning().execute();
    const category_id = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable).values({
      name: 'Test Product',
      code: 'P001',
      description: 'Test product description',
      price: '25.00',
      stock: 100,
      category_id
    }).returning().execute();
    const product_id = productResult[0].id;

    // Create test orders with different statuses
    const ordersResult = await db.insert(ordersTable).values([
      {
        user_id,
        total_amount: '100.00',
        status: 'pending',
        shipping_address: '123 Test St',
        shipping_method: 'Standard',
        shipping_cost: '10.00'
      },
      {
        user_id,
        total_amount: '200.00',
        status: 'completed',
        shipping_address: '123 Test St',
        shipping_method: 'Express',
        shipping_cost: '15.00'
      },
      {
        user_id,
        total_amount: '150.00',
        status: 'pending',
        shipping_address: '123 Test St',
        shipping_method: 'Standard',
        shipping_cost: '10.00'
      }
    ]).returning().execute();

    // Create order items
    await db.insert(orderItemsTable).values([
      {
        order_id: ordersResult[0].id,
        product_id,
        quantity: 2,
        price: '25.00'
      },
      {
        order_id: ordersResult[1].id,
        product_id,
        quantity: 4,
        price: '25.00'
      },
      {
        order_id: ordersResult[2].id,
        product_id,
        quantity: 3,
        price: '25.00'
      }
    ]).execute();

    const stats = await getDashboardStats();

    expect(stats.total_orders).toBe(3);
    expect(stats.total_revenue).toBe(450); // 100 + 200 + 150
    expect(stats.pending_orders).toBe(2);
    expect(stats.recent_orders).toHaveLength(3);
    
    // Check recent orders structure
    expect(stats.recent_orders[0]).toHaveProperty('id');
    expect(stats.recent_orders[0]).toHaveProperty('user_id');
    expect(stats.recent_orders[0]).toHaveProperty('total_amount');
    expect(stats.recent_orders[0]).toHaveProperty('status');
    expect(stats.recent_orders[0]).toHaveProperty('created_at');
    expect(stats.recent_orders[0].created_at).toBeInstanceOf(Date);

    // Check top selling products
    expect(stats.top_selling_products).toHaveLength(1);
    expect(stats.top_selling_products[0].product_id).toBe(product_id);
    expect(stats.top_selling_products[0].name).toBe('Test Product');
    expect(stats.top_selling_products[0].total_quantity).toBe(9); // 2 + 4 + 3
    expect(stats.top_selling_products[0].total_revenue).toBe(75); // 25 * 3 items
  });

  it('should handle multiple products in top selling correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable).values({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();
    const user_id = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable).values({
      name: 'Test Category',
      description: 'Test category description'
    }).returning().execute();
    const category_id = categoryResult[0].id;

    // Create test products
    const productsResult = await db.insert(productsTable).values([
      {
        name: 'Product A',
        code: 'PA001',
        description: 'Product A description',
        price: '10.00',
        stock: 100,
        category_id
      },
      {
        name: 'Product B',
        code: 'PB001',
        description: 'Product B description',
        price: '20.00',
        stock: 100,
        category_id
      },
      {
        name: 'Product C',
        code: 'PC001',
        description: 'Product C description',
        price: '30.00',
        stock: 100,
        category_id
      }
    ]).returning().execute();

    // Create test order
    const orderResult = await db.insert(ordersTable).values({
      user_id,
      total_amount: '180.00',
      status: 'completed',
      shipping_address: '123 Test St',
      shipping_method: 'Standard',
      shipping_cost: '10.00'
    }).returning().execute();
    const order_id = orderResult[0].id;

    // Create order items with different quantities
    await db.insert(orderItemsTable).values([
      {
        order_id,
        product_id: productsResult[0].id, // Product A - 5 units
        quantity: 5,
        price: '10.00'
      },
      {
        order_id,
        product_id: productsResult[1].id, // Product B - 3 units
        quantity: 3,
        price: '20.00'
      },
      {
        order_id,
        product_id: productsResult[2].id, // Product C - 1 unit
        quantity: 1,
        price: '30.00'
      }
    ]).execute();

    const stats = await getDashboardStats();

    expect(stats.top_selling_products).toHaveLength(3);
    
    // Should be sorted by quantity (descending)
    expect(stats.top_selling_products[0].name).toBe('Product A');
    expect(stats.top_selling_products[0].total_quantity).toBe(5);
    expect(stats.top_selling_products[0].total_revenue).toBe(10);
    
    expect(stats.top_selling_products[1].name).toBe('Product B');
    expect(stats.top_selling_products[1].total_quantity).toBe(3);
    expect(stats.top_selling_products[1].total_revenue).toBe(20);
    
    expect(stats.top_selling_products[2].name).toBe('Product C');
    expect(stats.top_selling_products[2].total_quantity).toBe(1);
    expect(stats.top_selling_products[2].total_revenue).toBe(30);
  });

  it('should limit recent orders to 10 items', async () => {
    // Create test user
    const userResult = await db.insert(usersTable).values({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();
    const user_id = userResult[0].id;

    // Create 15 orders to test the limit
    const orderPromises = [];
    for (let i = 1; i <= 15; i++) {
      orderPromises.push(
        db.insert(ordersTable).values({
          user_id,
          total_amount: `${i * 10}.00`,
          status: 'completed',
          shipping_address: '123 Test St',
          shipping_method: 'Standard',
          shipping_cost: '10.00'
        }).execute()
      );
    }
    
    await Promise.all(orderPromises);

    const stats = await getDashboardStats();

    expect(stats.total_orders).toBe(15);
    expect(stats.recent_orders).toHaveLength(10); // Should be limited to 10
    
    // Should be sorted by created_at descending (most recent first)
    for (let i = 0; i < stats.recent_orders.length - 1; i++) {
      expect(stats.recent_orders[i].created_at >= stats.recent_orders[i + 1].created_at).toBe(true);
    }
  });

  it('should limit top selling products to 5 items', async () => {
    // Create test user
    const userResult = await db.insert(usersTable).values({
      name: 'Test User',
      email: 'test@test.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();
    const user_id = userResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable).values({
      name: 'Test Category',
      description: 'Test category description'
    }).returning().execute();
    const category_id = categoryResult[0].id;

    // Create 8 products
    const productPromises = [];
    for (let i = 1; i <= 8; i++) {
      productPromises.push(
        db.insert(productsTable).values({
          name: `Product ${i}`,
          code: `P00${i}`,
          description: `Product ${i} description`,
          price: '10.00',
          stock: 100,
          category_id
        }).returning().execute()
      );
    }
    
    const productsResults = await Promise.all(productPromises);

    // Create test order
    const orderResult = await db.insert(ordersTable).values({
      user_id,
      total_amount: '360.00',
      status: 'completed',
      shipping_address: '123 Test St',
      shipping_method: 'Standard',
      shipping_cost: '10.00'
    }).returning().execute();
    const order_id = orderResult[0].id;

    // Create order items for all products with different quantities
    const orderItemPromises = productsResults.map((productResult, index) => 
      db.insert(orderItemsTable).values({
        order_id,
        product_id: productResult[0].id,
        quantity: 8 - index, // Quantities: 8, 7, 6, 5, 4, 3, 2, 1
        price: '10.00'
      }).execute()
    );
    
    await Promise.all(orderItemPromises);

    const stats = await getDashboardStats();

    expect(stats.top_selling_products).toHaveLength(5); // Should be limited to 5
    
    // Should be sorted by quantity descending
    expect(stats.top_selling_products[0].total_quantity).toBe(8);
    expect(stats.top_selling_products[1].total_quantity).toBe(7);
    expect(stats.top_selling_products[2].total_quantity).toBe(6);
    expect(stats.top_selling_products[3].total_quantity).toBe(5);
    expect(stats.top_selling_products[4].total_quantity).toBe(4);
  });
});