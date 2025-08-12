import { db } from '../db';
import { productsTable, cartItemsTable, orderItemsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const deleteProduct = async (id: number): Promise<boolean> => {
  try {
    // First check if the product exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (existingProduct.length === 0) {
      return false; // Product doesn't exist
    }

    // Check if product is referenced in any cart items
    const cartReferences = await db.select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.product_id, id))
      .execute();

    // Check if product is referenced in any order items
    const orderReferences = await db.select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.product_id, id))
      .execute();

    // If product is referenced in orders, we cannot delete it
    // Orders are permanent records for business/legal purposes
    if (orderReferences.length > 0) {
      throw new Error('Cannot delete product: product is referenced in existing orders');
    }

    // If product is in carts, remove those cart items first
    if (cartReferences.length > 0) {
      await db.delete(cartItemsTable)
        .where(eq(cartItemsTable.product_id, id))
        .execute();
    }

    // Finally, delete the product
    const result = await db.delete(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Product deletion failed:', error);
    throw error;
  }
};