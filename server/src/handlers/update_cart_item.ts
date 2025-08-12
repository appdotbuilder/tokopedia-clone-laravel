import { db } from '../db';
import { cartItemsTable, productsTable } from '../db/schema';
import { type UpdateCartItemInput, type CartItem } from '../schema';
import { eq, and } from 'drizzle-orm';

export const updateCartItem = async (input: UpdateCartItemInput): Promise<CartItem> => {
  try {
    // First, check if cart item exists
    const existingCartItems = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.id, input.id))
      .execute();

    if (existingCartItems.length === 0) {
      throw new Error('Cart item not found');
    }

    const existingCartItem = existingCartItems[0];

    // Check product stock availability
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, existingCartItem.product_id))
      .execute();

    if (products.length === 0) {
      throw new Error('Product not found');
    }

    const product = products[0];
    
    if (product.stock < input.quantity) {
      throw new Error('Insufficient stock available');
    }

    // Update cart item quantity
    const result = await db.update(cartItemsTable)
      .set({
        quantity: input.quantity,
        updated_at: new Date()
      })
      .where(eq(cartItemsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Cart item update failed:', error);
    throw error;
  }
};