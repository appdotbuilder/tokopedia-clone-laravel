import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { type UpdateCartItemInput } from '../schema';
import { updateCartItem } from '../handlers/update_cart_item';
import { eq } from 'drizzle-orm';

describe('updateCartItem', () => {
  let userId: number;
  let categoryId: number;
  let productId: number;
  let cartItemId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();
    userId = users[0].id;

    // Create test category
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A test category'
      })
      .returning()
      .execute();
    categoryId = categories[0].id;

    // Create test product with stock
    const products = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST-001',
        description: 'A test product',
        price: '19.99',
        stock: 50,
        category_id: categoryId
      })
      .returning()
      .execute();
    productId = products[0].id;

    // Create test cart item
    const cartItems = await db.insert(cartItemsTable)
      .values({
        user_id: userId,
        product_id: productId,
        quantity: 2
      })
      .returning()
      .execute();
    cartItemId = cartItems[0].id;
  });

  afterEach(resetDB);

  it('should update cart item quantity successfully', async () => {
    const input: UpdateCartItemInput = {
      id: cartItemId,
      quantity: 5
    };

    const result = await updateCartItem(input);

    expect(result.id).toEqual(cartItemId);
    expect(result.quantity).toEqual(5);
    expect(result.user_id).toEqual(userId);
    expect(result.product_id).toEqual(productId);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updated quantity to database', async () => {
    const input: UpdateCartItemInput = {
      id: cartItemId,
      quantity: 3
    };

    await updateCartItem(input);

    // Verify in database
    const cartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, cartItemId))
      .execute();

    expect(cartItems).toHaveLength(1);
    expect(cartItems[0].quantity).toEqual(3);
    expect(cartItems[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when cart item does not exist', async () => {
    const input: UpdateCartItemInput = {
      id: 99999, // Non-existent ID
      quantity: 1
    };

    await expect(updateCartItem(input)).rejects.toThrow(/cart item not found/i);
  });

  it('should throw error when product has insufficient stock', async () => {
    const input: UpdateCartItemInput = {
      id: cartItemId,
      quantity: 100 // More than available stock (50)
    };

    await expect(updateCartItem(input)).rejects.toThrow(/insufficient stock available/i);
  });

  it('should allow updating to exact stock amount', async () => {
    const input: UpdateCartItemInput = {
      id: cartItemId,
      quantity: 50 // Exact stock amount
    };

    const result = await updateCartItem(input);

    expect(result.quantity).toEqual(50);
  });

  it('should handle product deletion scenario', async () => {
    // Delete the product after cart item creation
    await db.delete(productsTable)
      .where(eq(productsTable.id, productId))
      .execute();

    const input: UpdateCartItemInput = {
      id: cartItemId,
      quantity: 1
    };

    await expect(updateCartItem(input)).rejects.toThrow(/product not found/i);
  });

  it('should update quantity to 1 (minimum valid quantity)', async () => {
    const input: UpdateCartItemInput = {
      id: cartItemId,
      quantity: 1
    };

    const result = await updateCartItem(input);

    expect(result.quantity).toEqual(1);
  });

  it('should handle zero stock product correctly', async () => {
    // Update product to have zero stock
    await db.update(productsTable)
      .set({ stock: 0 })
      .where(eq(productsTable.id, productId))
      .execute();

    const input: UpdateCartItemInput = {
      id: cartItemId,
      quantity: 1
    };

    await expect(updateCartItem(input)).rejects.toThrow(/insufficient stock available/i);
  });
});