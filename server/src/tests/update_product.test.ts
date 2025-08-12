import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type UpdateProductInput, type CreateCategoryInput } from '../schema';
import { updateProduct } from '../handlers/update_product';
import { eq } from 'drizzle-orm';

// Helper to create a test category
const createTestCategory = async (): Promise<number> => {
  const categoryInput: CreateCategoryInput = {
    name: 'Test Category',
    description: 'A category for testing'
  };

  const result = await db.insert(categoriesTable)
    .values({
      name: categoryInput.name,
      description: categoryInput.description
    })
    .returning()
    .execute();

  return result[0].id;
};

// Helper to create a test product
const createTestProduct = async (categoryId: number) => {
  const result = await db.insert(productsTable)
    .values({
      name: 'Test Product',
      code: 'TEST001',
      description: 'Original description',
      price: '19.99',
      stock: 100,
      category_id: categoryId,
      image: null
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateProduct', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update product name', async () => {
    const categoryId = await createTestCategory();
    const product = await createTestProduct(categoryId);

    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Product Name'
    };

    const result = await updateProduct(updateInput);

    expect(result.id).toEqual(product.id);
    expect(result.name).toEqual('Updated Product Name');
    expect(result.code).toEqual('TEST001'); // Unchanged
    expect(result.description).toEqual('Original description'); // Unchanged
    expect(result.price).toEqual(19.99);
    expect(result.stock).toEqual(100); // Unchanged
    expect(result.category_id).toEqual(categoryId); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields at once', async () => {
    const categoryId = await createTestCategory();
    const product = await createTestProduct(categoryId);

    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Updated Product',
      code: 'UPDATED001',
      description: 'Updated description',
      price: 29.99,
      stock: 50,
      image: 'updated-image.jpg'
    };

    const result = await updateProduct(updateInput);

    expect(result.name).toEqual('Updated Product');
    expect(result.code).toEqual('UPDATED001');
    expect(result.description).toEqual('Updated description');
    expect(result.price).toEqual(29.99);
    expect(result.stock).toEqual(50);
    expect(result.image).toEqual('updated-image.jpg');
    expect(result.category_id).toEqual(categoryId); // Unchanged
    expect(typeof result.price).toBe('number');
  });

  it('should update product category', async () => {
    const categoryId1 = await createTestCategory();
    const product = await createTestProduct(categoryId1);

    // Create second category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Second Category',
        description: 'Another category'
      })
      .returning()
      .execute();
    const categoryId2 = categoryResult[0].id;

    const updateInput: UpdateProductInput = {
      id: product.id,
      category_id: categoryId2
    };

    const result = await updateProduct(updateInput);

    expect(result.category_id).toEqual(categoryId2);
    expect(result.name).toEqual('Test Product'); // Unchanged
  });

  it('should save updated product to database', async () => {
    const categoryId = await createTestCategory();
    const product = await createTestProduct(categoryId);

    const updateInput: UpdateProductInput = {
      id: product.id,
      name: 'Database Updated Product',
      price: 39.99
    };

    await updateProduct(updateInput);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, product.id))
      .execute();

    expect(products).toHaveLength(1);
    expect(products[0].name).toEqual('Database Updated Product');
    expect(parseFloat(products[0].price)).toEqual(39.99);
  });

  it('should handle nullable fields correctly', async () => {
    const categoryId = await createTestCategory();
    const product = await createTestProduct(categoryId);

    const updateInput: UpdateProductInput = {
      id: product.id,
      description: null,
      image: null
    };

    const result = await updateProduct(updateInput);

    expect(result.description).toBeNull();
    expect(result.image).toBeNull();
  });

  it('should throw error for non-existent product', async () => {
    const updateInput: UpdateProductInput = {
      id: 99999,
      name: 'Non-existent Product'
    };

    expect(updateProduct(updateInput)).rejects.toThrow(/Product with ID 99999 not found/i);
  });

  it('should throw error for duplicate product code', async () => {
    const categoryId = await createTestCategory();
    const product1 = await createTestProduct(categoryId);
    
    // Create second product with different code
    const product2 = await db.insert(productsTable)
      .values({
        name: 'Second Product',
        code: 'TEST002',
        description: 'Second product',
        price: '25.99',
        stock: 50,
        category_id: categoryId,
        image: null
      })
      .returning()
      .execute();

    const updateInput: UpdateProductInput = {
      id: product2[0].id,
      code: 'TEST001' // Try to use product1's code
    };

    expect(updateProduct(updateInput)).rejects.toThrow(/Product code 'TEST001' already exists/i);
  });

  it('should throw error for non-existent category', async () => {
    const categoryId = await createTestCategory();
    const product = await createTestProduct(categoryId);

    const updateInput: UpdateProductInput = {
      id: product.id,
      category_id: 99999
    };

    expect(updateProduct(updateInput)).rejects.toThrow(/Category with ID 99999 not found/i);
  });

  it('should allow updating code to same value', async () => {
    const categoryId = await createTestCategory();
    const product = await createTestProduct(categoryId);

    const updateInput: UpdateProductInput = {
      id: product.id,
      code: 'TEST001', // Same as original
      name: 'Updated Name'
    };

    const result = await updateProduct(updateInput);

    expect(result.code).toEqual('TEST001');
    expect(result.name).toEqual('Updated Name');
  });

  it('should update only provided fields', async () => {
    const categoryId = await createTestCategory();
    const product = await createTestProduct(categoryId);
    const originalUpdatedAt = product.updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateProductInput = {
      id: product.id,
      stock: 75
    };

    const result = await updateProduct(updateInput);

    expect(result.stock).toEqual(75);
    expect(result.name).toEqual('Test Product'); // Unchanged
    expect(result.code).toEqual('TEST001'); // Unchanged
    expect(result.price).toEqual(19.99); // Unchanged
    expect(result.updated_at > originalUpdatedAt).toBe(true);
  });
});