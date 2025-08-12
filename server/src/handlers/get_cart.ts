import { db } from '../db';
import { cartItemsTable, productsTable, categoriesTable } from '../db/schema';
import { type CartItem, type Product, type Category } from '../schema';
import { eq } from 'drizzle-orm';

// Extended cart item type with product details
export type CartItemWithDetails = CartItem & {
  product: Product;
  category: Category;
  subtotal: number;
};

export const getCart = async (userId: number): Promise<CartItemWithDetails[]> => {
  try {
    // Query cart items with product and category details using joins
    const results = await db.select({
      id: cartItemsTable.id,
      user_id: cartItemsTable.user_id,
      product_id: cartItemsTable.product_id,
      quantity: cartItemsTable.quantity,
      created_at: cartItemsTable.created_at,
      updated_at: cartItemsTable.updated_at,
      product: {
        id: productsTable.id,
        name: productsTable.name,
        code: productsTable.code,
        description: productsTable.description,
        price: productsTable.price,
        stock: productsTable.stock,
        category_id: productsTable.category_id,
        image: productsTable.image,
        created_at: productsTable.created_at,
        updated_at: productsTable.updated_at
      },
      category: {
        id: categoriesTable.id,
        name: categoriesTable.name,
        description: categoriesTable.description,
        created_at: categoriesTable.created_at,
        updated_at: categoriesTable.updated_at
      }
    })
    .from(cartItemsTable)
    .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
    .innerJoin(categoriesTable, eq(productsTable.category_id, categoriesTable.id))
    .where(eq(cartItemsTable.user_id, userId))
    .execute();

    // Transform results to include product details and convert numeric fields
    return results.map(result => ({
      id: result.id,
      user_id: result.user_id,
      product_id: result.product_id,
      quantity: result.quantity,
      created_at: result.created_at,
      updated_at: result.updated_at,
      // Include product details with converted numeric fields
      product: {
        ...result.product,
        price: parseFloat(result.product.price), // Convert numeric to number
      },
      // Include category details
      category: result.category,
      // Calculate subtotal
      subtotal: parseFloat(result.product.price) * result.quantity
    }));
  } catch (error) {
    console.error('Get cart failed:', error);
    throw error;
  }
};