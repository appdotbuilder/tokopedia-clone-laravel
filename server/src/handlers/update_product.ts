import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq, and, ne } from 'drizzle-orm';

export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    // First, verify the product exists
    const existingProducts = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, input.id))
      .execute();

    if (existingProducts.length === 0) {
      throw new Error(`Product with ID ${input.id} not found`);
    }

    // If code is being updated, check for uniqueness
    if (input.code !== undefined) {
      const codeConflicts = await db.select()
        .from(productsTable)
        .where(and(
          eq(productsTable.code, input.code),
          ne(productsTable.id, input.id)
        ))
        .execute();

      if (codeConflicts.length > 0) {
        throw new Error(`Product code '${input.code}' already exists`);
      }
    }

    // If category_id is being updated, verify category exists
    if (input.category_id !== undefined) {
      const categories = await db.select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, input.category_id))
        .execute();

      if (categories.length === 0) {
        throw new Error(`Category with ID ${input.category_id} not found`);
      }
    }

    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.code !== undefined) updateData.code = input.code;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.price !== undefined) updateData.price = input.price.toString();
    if (input.stock !== undefined) updateData.stock = input.stock;
    if (input.category_id !== undefined) updateData.category_id = input.category_id;
    if (input.image !== undefined) updateData.image = input.image;

    // Update the product
    const result = await db.update(productsTable)
      .set(updateData)
      .where(eq(productsTable.id, input.id))
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const product = result[0];
    return {
      ...product,
      price: parseFloat(product.price)
    };
  } catch (error) {
    console.error('Product update failed:', error);
    throw error;
  }
};