import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { getProductById } from '../handlers/get_product_by_id';

describe('getProductById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return a product when found', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Test Category',
        description: 'A category for testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create test product
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A product for testing',
        price: '29.99',
        stock: 50,
        category_id: categoryId,
        image: 'test-image.jpg'
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Test the handler
    const result = await getProductById(productId);

    // Validate the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(productId);
    expect(result!.name).toEqual('Test Product');
    expect(result!.code).toEqual('TEST001');
    expect(result!.description).toEqual('A product for testing');
    expect(result!.price).toEqual(29.99);
    expect(typeof result!.price).toEqual('number');
    expect(result!.stock).toEqual(50);
    expect(result!.category_id).toEqual(categoryId);
    expect(result!.image).toEqual('test-image.jpg');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when product is not found', async () => {
    const result = await getProductById(999);
    
    expect(result).toBeNull();
  });

  it('should handle products with null fields correctly', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Minimal Category',
        description: null
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create product with minimal data
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Minimal Product',
        code: 'MIN001',
        description: null,
        price: '15.50',
        stock: 0,
        category_id: categoryId,
        image: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Test the handler
    const result = await getProductById(productId);

    // Validate null fields are handled correctly
    expect(result).not.toBeNull();
    expect(result!.description).toBeNull();
    expect(result!.image).toBeNull();
    expect(result!.price).toEqual(15.50);
    expect(typeof result!.price).toEqual('number');
    expect(result!.stock).toEqual(0);
  });

  it('should correctly convert numeric price field', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Price Test Category',
        description: 'For price testing'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create product with decimal price
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Price Test Product',
        code: 'PRICE001',
        description: 'Testing price conversion',
        price: '123.45',
        stock: 10,
        category_id: categoryId,
        image: null
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Test the handler
    const result = await getProductById(productId);

    // Validate price conversion
    expect(result).not.toBeNull();
    expect(result!.price).toEqual(123.45);
    expect(typeof result!.price).toEqual('number');
    expect(result!.price.toFixed(2)).toEqual('123.45');
  });

  it('should handle products with zero price', async () => {
    // Create prerequisite category
    const categoryResult = await db.insert(categoriesTable)
      .values({
        name: 'Free Category',
        description: 'For free products'
      })
      .returning()
      .execute();

    const categoryId = categoryResult[0].id;

    // Create product with zero price
    const productResult = await db.insert(productsTable)
      .values({
        name: 'Free Product',
        code: 'FREE001',
        description: 'A free product',
        price: '0.00',
        stock: 100,
        category_id: categoryId
      })
      .returning()
      .execute();

    const productId = productResult[0].id;

    // Test the handler
    const result = await getProductById(productId);

    // Validate zero price handling
    expect(result).not.toBeNull();
    expect(result!.price).toEqual(0);
    expect(typeof result!.price).toEqual('number');
  });

  it('should handle negative product IDs gracefully', async () => {
    const result = await getProductById(-1);
    
    expect(result).toBeNull();
  });
});