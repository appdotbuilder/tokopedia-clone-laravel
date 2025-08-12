import { db } from '../db';
import { productsTable } from '../db/schema';
import { type Product, type ProductFilter } from '../schema';
import { eq, gte, lte, ilike, and, count, desc, type SQL } from 'drizzle-orm';

export const getProducts = async (filter?: ProductFilter): Promise<{ products: Product[], total: number }> => {
  try {
    // Apply default values for pagination since filter is optional
    const limit = filter?.limit || 20;
    const page = filter?.page || 1;
    const offset = (page - 1) * limit;

    // Collect filter conditions
    const conditions: SQL<unknown>[] = [];

    if (filter?.category_id) {
      conditions.push(eq(productsTable.category_id, filter.category_id));
    }

    if (filter?.search) {
      // Search in both name and description (case insensitive)
      conditions.push(
        ilike(productsTable.name, `%${filter.search}%`)
      );
    }

    if (filter?.min_price !== undefined) {
      conditions.push(gte(productsTable.price, filter.min_price.toString()));
    }

    if (filter?.max_price !== undefined) {
      conditions.push(lte(productsTable.price, filter.max_price.toString()));
    }

    // Build and execute products query in one chain
    const results = await db.select()
      .from(productsTable)
      .where(conditions.length > 0 
        ? (conditions.length === 1 ? conditions[0] : and(...conditions))
        : undefined
      )
      .orderBy(desc(productsTable.id))
      .limit(limit)
      .offset(offset)
      .execute();

    // Convert numeric fields back to numbers
    const products: Product[] = results.map(product => ({
      ...product,
      price: parseFloat(product.price)
    }));

    // Get total count for pagination in one chain
    const totalResult = await db.select({ count: count() })
      .from(productsTable)
      .where(conditions.length > 0 
        ? (conditions.length === 1 ? conditions[0] : and(...conditions))
        : undefined
      )
      .execute();

    const total = totalResult[0].count;

    return { products, total };
  } catch (error) {
    console.error('Get products failed:', error);
    throw error;
  }
};