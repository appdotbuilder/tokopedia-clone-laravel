import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type CreateProductInput } from '../schema';
import { createProduct } from '../handlers/create_product';
import { eq } from 'drizzle-orm';

describe('createProduct', () => {
  let testCategory: { id: number };

  beforeEach(async () => {
    await createDB();
    
    // Create a test category first (required foreign key)
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'Category for testing'
      })
      .returning()
      .execute();
    
    testCategory = categoryResult[0];
  });

  afterEach(resetDB);

  // Valid test input with all fields
  const testInput: CreateProductInput = {
    name: 'Test Product',
    code: 'TEST001',
    description: 'A product for testing',
    price: 29.99,
    stock: 100,
    category_id: 1, // Will be updated to use testCategory.id
    image: 'test-image.jpg'
  };

  it('should create a product with all fields', async () => {
    const input = { ...testInput, category_id: testCategory.id };
    const result = await createProduct(input);

    // Validate all returned fields
    expect(result.name).toEqual('Test Product');
    expect(result.code).toEqual('TEST001');
    expect(result.description).toEqual('A product for testing');
    expect(result.price).toEqual(29.99);
    expect(typeof result.price).toBe('number'); // Verify numeric conversion
    expect(result.stock).toEqual(100);
    expect(result.category_id).toEqual(testCategory.id);
    expect(result.image).toEqual('test-image.jpg');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a product with minimal fields', async () => {
    const minimalInput: CreateProductInput = {
      name: 'Minimal Product',
      code: 'MIN001',
      description: null,
      price: 15.50,
      stock: 0,
      category_id: testCategory.id,
      image: null
    };

    const result = await createProduct(minimalInput);

    expect(result.name).toEqual('Minimal Product');
    expect(result.code).toEqual('MIN001');
    expect(result.description).toBeNull();
    expect(result.price).toEqual(15.50);
    expect(result.stock).toEqual(0);
    expect(result.category_id).toEqual(testCategory.id);
    expect(result.image).toBeNull();
    expect(result.id).toBeDefined();
  });

  it('should save product to database correctly', async () => {
    const input = { ...testInput, category_id: testCategory.id };
    const result = await createProduct(input);

    // Query database to verify product was saved
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products).toHaveLength(1);
    const savedProduct = products[0];
    expect(savedProduct.name).toEqual('Test Product');
    expect(savedProduct.code).toEqual('TEST001');
    expect(savedProduct.description).toEqual('A product for testing');
    expect(parseFloat(savedProduct.price)).toEqual(29.99); // Verify numeric storage
    expect(savedProduct.stock).toEqual(100);
    expect(savedProduct.category_id).toEqual(testCategory.id);
    expect(savedProduct.image).toEqual('test-image.jpg');
    expect(savedProduct.created_at).toBeInstanceOf(Date);
    expect(savedProduct.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when category does not exist', async () => {
    const input = { ...testInput, category_id: 999 }; // Non-existent category

    await expect(createProduct(input)).rejects.toThrow(/Category with id 999 not found/i);
  });

  it('should throw error when product code already exists', async () => {
    const input = { ...testInput, category_id: testCategory.id };
    
    // Create first product
    await createProduct(input);

    // Try to create another product with same code
    const duplicateInput = { 
      ...input, 
      name: 'Different Product',
      code: 'TEST001' // Same code
    };

    await expect(createProduct(duplicateInput)).rejects.toThrow(/Product with code 'TEST001' already exists/i);
  });

  it('should handle decimal prices correctly', async () => {
    const input = { 
      ...testInput, 
      category_id: testCategory.id,
      price: 123.45
    };
    
    const result = await createProduct(input);

    expect(result.price).toEqual(123.45);
    expect(typeof result.price).toBe('number');

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(parseFloat(products[0].price)).toEqual(123.45);
  });

  it('should handle zero stock correctly', async () => {
    const input = { 
      ...testInput, 
      category_id: testCategory.id,
      stock: 0
    };
    
    const result = await createProduct(input);

    expect(result.stock).toEqual(0);

    // Verify in database
    const products = await db.select()
      .from(productsTable)
      .where(eq(productsTable.id, result.id))
      .execute();

    expect(products[0].stock).toEqual(0);
  });

  it('should create multiple products with different codes', async () => {
    const input1 = { ...testInput, category_id: testCategory.id, code: 'PROD001' };
    const input2 = { ...testInput, category_id: testCategory.id, code: 'PROD002', name: 'Product 2' };

    const result1 = await createProduct(input1);
    const result2 = await createProduct(input2);

    expect(result1.code).toEqual('PROD001');
    expect(result2.code).toEqual('PROD002');
    expect(result1.id).not.toEqual(result2.id);

    // Verify both products exist in database
    const products = await db.select()
      .from(productsTable)
      .execute();

    expect(products).toHaveLength(2);
    const codes = products.map(p => p.code);
    expect(codes).toContain('PROD001');
    expect(codes).toContain('PROD002');
  });
});