import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const getProductById = async (id: number): Promise<Product | null> => {
  try {
    const results = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, id))
      .execute();

    if (results.length === 0) {
      return null;
    }

    const product = results[0];
    
    // Convert numeric fields back to numbers for the return type
    return {
      ...product,
      price: parseFloat(product.price)
    };
  } catch (error) {
    console.error('Failed to get product by ID:', error);
    throw error;
  }
};