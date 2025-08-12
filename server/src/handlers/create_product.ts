import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

export const createProduct = async (input: CreateProductInput): Promise<Product> => {
  try {
    // Validate category exists
    const category = await db.select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, input.category_id))
      .execute();

    if (category.length === 0) {
      throw new Error(`Category with id ${input.category_id} not found`);
    }

    // Check if product code already exists
    const existingProduct = await db.select()
      .from(productsTable)
      .where(eq(productsTable.code, input.code))
      .execute();

    if (existingProduct.length > 0) {
      throw new Error(`Product with code '${input.code}' already exists`);
    }

    // Insert product record
    const result = await db.insert(productsTable)
      .values({
        name: input.name,
        code: input.code,
        description: input.description,
        price: input.price.toString(), // Convert number to string for numeric column
        stock: input.stock,
        category_id: input.category_id,
        image: input.image
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price) // Convert string back to number
    };
  } catch (error) {
    console.error('Product creation failed:', error);
    throw error;
  }
};