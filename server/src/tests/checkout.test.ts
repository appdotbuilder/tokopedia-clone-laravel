import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable, ordersTable, orderItemsTable } from '../db/schema';
import { type CheckoutInput } from '../schema';
import { checkout } from '../handlers/checkout';
import { eq } from 'drizzle-orm';

// Test data
const testUser = {
  name: 'Test Customer',
  email: 'customer@test.com',
  password: 'password123',
  role: 'Customer' as const
};

const testCategory = {
  name: 'Test Category',
  description: 'Category for testing'
};

const testProduct1 = {
  name: 'Product 1',
  code: 'PROD1',
  description: 'First test product',
  price: '29.99',
  stock: 10,
  category_id: 1
};

const testProduct2 = {
  name: 'Product 2',
  code: 'PROD2',
  description: 'Second test product',
  price: '49.99',
  stock: 5,
  category_id: 1
};

const testCheckoutInput: CheckoutInput = {
  user_id: 1,
  shipping_address: '123 Main St, City, State 12345',
  shipping_method: 'standard',
  payment_method: 'credit_card'
};

describe('checkout', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should process checkout successfully', async () => {
    // Setup test data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await db.insert(categoriesTable).values(testCategory).execute();
    
    const productResults = await db.insert(productsTable)
      .values([testProduct1, testProduct2])
      .returning()
      .execute();

    // Add items to cart
    await db.insert(cartItemsTable).values([
      { user_id: user.id, product_id: productResults[0].id, quantity: 2 },
      { user_id: user.id, product_id: productResults[1].id, quantity: 1 }
    ]).execute();

    // Process checkout
    const result = await checkout({
      ...testCheckoutInput,
      user_id: user.id
    });

    // Verify order creation
    expect(result.user_id).toEqual(user.id);
    expect(result.status).toEqual('pending');
    expect(result.payment_status).toEqual('pending');
    expect(result.shipping_address).toEqual(testCheckoutInput.shipping_address);
    expect(result.shipping_method).toEqual('standard');
    expect(result.payment_method).toEqual('credit_card');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify total calculation: (29.99 * 2) + (49.99 * 1) = 109.97, free shipping over $100
    expect(result.total_amount).toEqual(109.97);
    expect(result.shipping_cost).toEqual(0); // Free shipping over $100
    expect(typeof result.total_amount).toBe('number');
    expect(typeof result.shipping_cost).toBe('number');
  });

  it('should create order items correctly', async () => {
    // Setup test data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await db.insert(categoriesTable).values(testCategory).execute();
    
    const productResults = await db.insert(productsTable)
      .values([testProduct1, testProduct2])
      .returning()
      .execute();

    await db.insert(cartItemsTable).values([
      { user_id: user.id, product_id: productResults[0].id, quantity: 3 },
      { user_id: user.id, product_id: productResults[1].id, quantity: 2 }
    ]).execute();

    const result = await checkout({
      ...testCheckoutInput,
      user_id: user.id
    });

    // Verify order items were created
    const orderItems = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.order_id, result.id))
      .execute();

    expect(orderItems).toHaveLength(2);
    
    const item1 = orderItems.find(item => item.product_id === productResults[0].id);
    const item2 = orderItems.find(item => item.product_id === productResults[1].id);

    expect(item1?.quantity).toEqual(3);
    expect(parseFloat(item1!.price)).toEqual(29.99);
    
    expect(item2?.quantity).toEqual(2);
    expect(parseFloat(item2!.price)).toEqual(49.99);
  });

  it('should update product stock after checkout', async () => {
    // Setup test data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await db.insert(categoriesTable).values(testCategory).execute();
    
    const productResults = await db.insert(productsTable)
      .values([testProduct1, testProduct2])
      .returning()
      .execute();

    await db.insert(cartItemsTable).values([
      { user_id: user.id, product_id: productResults[0].id, quantity: 3 },
      { user_id: user.id, product_id: productResults[1].id, quantity: 2 }
    ]).execute();

    await checkout({
      ...testCheckoutInput,
      user_id: user.id
    });

    // Verify stock was updated
    const updatedProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productResults[0].id))
      .execute();

    expect(updatedProducts[0].stock).toEqual(7); // 10 - 3 = 7

    const product2 = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, productResults[1].id))
      .execute();

    expect(product2[0].stock).toEqual(3); // 5 - 2 = 3
  });

  it('should clear cart after successful checkout', async () => {
    // Setup test data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await db.insert(categoriesTable).values(testCategory).execute();
    
    const productResults = await db.insert(productsTable)
      .values([testProduct1])
      .returning()
      .execute();

    await db.insert(cartItemsTable).values([
      { user_id: user.id, product_id: productResults[0].id, quantity: 1 }
    ]).execute();

    await checkout({
      ...testCheckoutInput,
      user_id: user.id
    });

    // Verify cart is empty
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, user.id))
      .execute();

    expect(cartItems).toHaveLength(0);
  });

  it('should calculate different shipping costs correctly', async () => {
    // Setup test data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await db.insert(categoriesTable).values(testCategory).execute();
    
    const productResults = await db.insert(productsTable)
      .values([testProduct1])
      .returning()
      .execute();

    await db.insert(cartItemsTable).values([
      { user_id: user.id, product_id: productResults[0].id, quantity: 1 }
    ]).execute();

    // Test express shipping
    const expressResult = await checkout({
      ...testCheckoutInput,
      user_id: user.id,
      shipping_method: 'express'
    });

    expect(expressResult.shipping_cost).toEqual(19.99);
    expect(expressResult.total_amount).toEqual(29.99 + 19.99);
  });

  it('should provide free shipping for orders over $100', async () => {
    // Setup test data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await db.insert(categoriesTable).values(testCategory).execute();
    
    const expensiveProduct = {
      name: 'Expensive Product',
      code: 'EXP1',
      description: 'High-value item',
      price: '150.00',
      stock: 10,
      category_id: 1
    };

    const productResults = await db.insert(productsTable)
      .values([expensiveProduct])
      .returning()
      .execute();

    await db.insert(cartItemsTable).values([
      { user_id: user.id, product_id: productResults[0].id, quantity: 1 }
    ]).execute();

    const result = await checkout({
      ...testCheckoutInput,
      user_id: user.id,
      shipping_method: 'standard'
    });

    expect(result.shipping_cost).toEqual(0); // Free shipping
    expect(result.total_amount).toEqual(150.00);
  });

  it('should throw error when cart is empty', async () => {
    // Setup user only (no cart items)
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await expect(checkout({
      ...testCheckoutInput,
      user_id: user.id
    })).rejects.toThrow(/cart is empty/i);
  });

  it('should throw error when insufficient stock', async () => {
    // Setup test data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await db.insert(categoriesTable).values(testCategory).execute();
    
    const lowStockProduct = {
      name: 'Low Stock Product',
      code: 'LOW1',
      description: 'Product with limited stock',
      price: '29.99',
      stock: 2, // Only 2 in stock
      category_id: 1
    };

    const productResults = await db.insert(productsTable)
      .values([lowStockProduct])
      .returning()
      .execute();

    // Try to add 5 items to cart (more than available)
    await db.insert(cartItemsTable).values([
      { user_id: user.id, product_id: productResults[0].id, quantity: 5 }
    ]).execute();

    await expect(checkout({
      ...testCheckoutInput,
      user_id: user.id
    })).rejects.toThrow(/insufficient stock/i);
  });

  it('should save order to database correctly', async () => {
    // Setup test data
    const userResult = await db.insert(usersTable).values(testUser).returning().execute();
    const user = userResult[0];

    await db.insert(categoriesTable).values(testCategory).execute();
    
    const productResults = await db.insert(productsTable)
      .values([testProduct1])
      .returning()
      .execute();

    await db.insert(cartItemsTable).values([
      { user_id: user.id, product_id: productResults[0].id, quantity: 1 }
    ]).execute();

    const result = await checkout({
      ...testCheckoutInput,
      user_id: user.id
    });

    // Verify order exists in database
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, result.id))
      .execute();

    expect(orders).toHaveLength(1);
    const savedOrder = orders[0];
    
    expect(savedOrder.user_id).toEqual(user.id);
    expect(parseFloat(savedOrder.total_amount)).toEqual(39.98); // 29.99 + 9.99 shipping
    expect(savedOrder.status).toEqual('pending');
    expect(savedOrder.shipping_address).toEqual(testCheckoutInput.shipping_address);
    expect(savedOrder.created_at).toBeInstanceOf(Date);
  });
});