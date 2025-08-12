import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { type AddToCartInput } from '../schema';
import { addToCart } from '../handlers/add_to_cart';
import { eq, and } from 'drizzle-orm';

describe('addToCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testAdminId: number;
  let testCategoryId: number;
  let testProductId: number;
  let testLowStockProductId: number;

  beforeEach(async () => {
    // Create test user (Customer)
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();
    testUserId = userResult[0].id;

    // Create test admin user
    const adminResult = await db.insert(usersTable)
      .values({
        name: 'Test Admin',
        email: 'admin@test.com',
        password: 'password123',
        role: 'Admin'
      })
      .returning()
      .execute();
    testAdminId = adminResult[0].id;

    // Create test category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Test category for products'
      })
      .returning()
      .execute();
    testCategoryId = categoryResult[0].id;

    // Create test product with good stock
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '29.99',
        stock: 100,
        category_id: testCategoryId
      })
      .returning()
      .execute();
    testProductId = productResult[0].id;

    // Create test product with low stock
    const lowStockResult = await db.insert(productsTable)
      .values({
        name: 'Low Stock Product',
        code: 'LOW001',
        description: 'A product with low stock',
        price: '19.99',
        stock: 2,
        category_id: testCategoryId
      })
      .returning()
      .execute();
    testLowStockProductId = lowStockResult[0].id;
  });

  const testInput: AddToCartInput = {
    user_id: 0, // Will be set in tests
    product_id: 0, // Will be set in tests
    quantity: 3
  };

  it('should add new product to cart', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testProductId
    };

    const result = await addToCart(input);

    expect(result.user_id).toEqual(testUserId);
    expect(result.product_id).toEqual(testProductId);
    expect(result.quantity).toEqual(3);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save cart item to database', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testProductId
    };

    const result = await addToCart(input);

    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, result.id))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].user_id).toEqual(testUserId);
    expect(cartItems[0].product_id).toEqual(testProductId);
    expect(cartItems[0].quantity).toEqual(3);
  });

  it('should update quantity if product already in cart', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testProductId,
      quantity: 2
    };

    // Add product first time
    await addToCart(input);

    // Add same product again
    const result = await addToCart({
      ...input,
      quantity: 3
    });

    expect(result.quantity).toEqual(5); // 2 + 3

    // Verify only one cart item exists
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.user_id, testUserId),
          eq(cartItemsTable.product_id, testProductId)
        )
      )
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(5);
  });

  it('should throw error for non-existent user', async () => {
    const input = {
      ...testInput,
      user_id: 999999,
      product_id: testProductId
    };

    await expect(addToCart(input)).rejects.toThrow(/user not found/i);
  });

  it('should throw error for admin user', async () => {
    const input = {
      ...testInput,
      user_id: testAdminId,
      product_id: testProductId
    };

    await expect(addToCart(input)).rejects.toThrow(/only customers can add items/i);
  });

  it('should throw error for non-existent product', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: 999999
    };

    await expect(addToCart(input)).rejects.toThrow(/product not found/i);
  });

  it('should throw error for insufficient stock', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testLowStockProductId,
      quantity: 5 // Product only has stock of 2
    };

    await expect(addToCart(input)).rejects.toThrow(/insufficient stock/i);
  });

  it('should throw error when updating cart would exceed stock', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testLowStockProductId,
      quantity: 1
    };

    // Add 1 item first
    await addToCart(input);

    // Try to add 2 more (total would be 3, but stock is only 2)
    await expect(addToCart({
      ...input,
      quantity: 2
    })).rejects.toThrow(/total quantity would exceed/i);
  });

  it('should handle edge case of adding exactly remaining stock', async () => {
    const input = {
      ...testInput,
      user_id: testUserId,
      product_id: testLowStockProductId,
      quantity: 1
    };

    // Add 1 item first
    await addToCart(input);

    // Add exactly the remaining stock (1 more)
    const result = await addToCart({
      ...input,
      quantity: 1
    });

    expect(result.quantity).toEqual(2);
  });

  it('should handle multiple products in same user cart', async () => {
    // Add first product
    await addToCart({
      user_id: testUserId,
      product_id: testProductId,
      quantity: 2
    });

    // Add second product
    await addToCart({
      user_id: testUserId,
      product_id: testLowStockProductId,
      quantity: 1
    });

    // Verify both products exist in cart
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.user_id, testUserId))
      .execute();

    expect(cartItems).toHaveLength(2);
    
    const productIds = cartItems.map(item => item.product_id).sort();
    expect(productIds).toEqual([testProductId, testLowStockProductId].sort());
  });
});