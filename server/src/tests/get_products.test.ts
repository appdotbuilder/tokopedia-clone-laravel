import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable, categoriesTable } from '../db/schema';
import { type ProductFilter } from '../schema';
import { getProducts } from '../handlers/get_products';

describe('getProducts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty result when no products exist', async () => {
    const result = await getProducts();

    expect(result.products).toEqual([]);
    expect(result.total).toEqual(0);
  });

  it('should return all products without filters', async () => {
    // Create test category first
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          code: 'LAP001',
          description: 'Gaming laptop',
          price: '999.99',
          stock: 10,
          category_id: category.id,
          image: null
        },
        {
          name: 'Phone',
          code: 'PHN001',
          description: 'Smartphone',
          price: '599.99',
          stock: 20,
          category_id: category.id,
          image: null
        }
      ])
      .execute();

    const result = await getProducts();

    expect(result.products).toHaveLength(2);
    expect(result.total).toEqual(2);
    
    // Check numeric conversion
    expect(typeof result.products[0].price).toBe('number');
    expect(result.products[0].price).toEqual(599.99); // Phone should be first (newest)
    expect(result.products[1].price).toEqual(999.99); // Laptop should be second
  });

  it('should filter products by category_id', async () => {
    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Electronics', description: 'Electronic products' },
        { name: 'Books', description: 'Books and literature' }
      ])
      .returning()
      .execute();

    // Create products in different categories
    await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          code: 'LAP001',
          description: 'Gaming laptop',
          price: '999.99',
          stock: 10,
          category_id: categories[0].id,
          image: null
        },
        {
          name: 'Novel',
          code: 'NOV001',
          description: 'Fiction novel',
          price: '19.99',
          stock: 50,
          category_id: categories[1].id,
          image: null
        }
      ])
      .execute();

    const filter: ProductFilter = {
      category_id: categories[0].id,
      page: 1,
      limit: 20
    };

    const result = await getProducts(filter);

    expect(result.products).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.products[0].name).toEqual('Laptop');
    expect(result.products[0].category_id).toEqual(categories[0].id);
  });

  it('should filter products by search term', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    // Create test products
    await db.insert(productsTable)
      .values([
        {
          name: 'Gaming Laptop',
          code: 'LAP001',
          description: 'High performance laptop',
          price: '999.99',
          stock: 10,
          category_id: category.id,
          image: null
        },
        {
          name: 'Office Phone',
          code: 'PHN001',
          description: 'Business phone',
          price: '199.99',
          stock: 15,
          category_id: category.id,
          image: null
        }
      ])
      .execute();

    const filter: ProductFilter = {
      search: 'laptop',
      page: 1,
      limit: 20
    };

    const result = await getProducts(filter);

    expect(result.products).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.products[0].name).toEqual('Gaming Laptop');
  });

  it('should filter products by price range', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    // Create products with different prices
    await db.insert(productsTable)
      .values([
        {
          name: 'Budget Phone',
          code: 'PHN001',
          description: 'Affordable smartphone',
          price: '199.99',
          stock: 25,
          category_id: category.id,
          image: null
        },
        {
          name: 'Mid-range Laptop',
          code: 'LAP001',
          description: 'Good performance laptop',
          price: '799.99',
          stock: 10,
          category_id: category.id,
          image: null
        },
        {
          name: 'Premium Tablet',
          code: 'TAB001',
          description: 'High-end tablet',
          price: '1299.99',
          stock: 5,
          category_id: category.id,
          image: null
        }
      ])
      .execute();

    const filter: ProductFilter = {
      min_price: 300,
      max_price: 1000,
      page: 1,
      limit: 20
    };

    const result = await getProducts(filter);

    expect(result.products).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.products[0].name).toEqual('Mid-range Laptop');
    expect(result.products[0].price).toEqual(799.99);
  });

  it('should handle pagination correctly', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    // Create 5 test products
    const products = [];
    for (let i = 1; i <= 5; i++) {
      products.push({
        name: `Product ${i}`,
        code: `PRD00${i}`,
        description: `Description for product ${i}`,
        price: `${i * 100}.99`,
        stock: i * 10,
        category_id: category.id,
        image: null
      });
    }

    await db.insert(productsTable)
      .values(products)
      .execute();

    // Test first page
    const page1Filter: ProductFilter = {
      page: 1,
      limit: 2
    };

    const page1Result = await getProducts(page1Filter);

    expect(page1Result.products).toHaveLength(2);
    expect(page1Result.total).toEqual(5);
    // Should be ordered by id desc (newest first)
    expect(page1Result.products[0].name).toEqual('Product 5');
    expect(page1Result.products[1].name).toEqual('Product 4');

    // Test second page
    const page2Filter: ProductFilter = {
      page: 2,
      limit: 2
    };

    const page2Result = await getProducts(page2Filter);

    expect(page2Result.products).toHaveLength(2);
    expect(page2Result.total).toEqual(5);
    expect(page2Result.products[0].name).toEqual('Product 3');
    expect(page2Result.products[1].name).toEqual('Product 2');
  });

  it('should combine multiple filters correctly', async () => {
    // Create test categories
    const categories = await db.insert(categoriesTable)
      .values([
        { name: 'Electronics', description: 'Electronic products' },
        { name: 'Books', description: 'Books and literature' }
      ])
      .returning()
      .execute();

    // Create various products
    await db.insert(productsTable)
      .values([
        {
          name: 'Gaming Laptop',
          code: 'LAP001',
          description: 'High performance gaming laptop',
          price: '1299.99',
          stock: 5,
          category_id: categories[0].id,
          image: null
        },
        {
          name: 'Office Laptop',
          code: 'LAP002',
          description: 'Business laptop for office work',
          price: '699.99',
          stock: 15,
          category_id: categories[0].id,
          image: null
        },
        {
          name: 'Laptop Guide Book',
          code: 'BOOK001',
          description: 'Guide to buying laptops',
          price: '29.99',
          stock: 100,
          category_id: categories[1].id,
          image: null
        }
      ])
      .execute();

    const filter: ProductFilter = {
      category_id: categories[0].id,
      search: 'laptop',
      min_price: 500,
      max_price: 1000,
      page: 1,
      limit: 20
    };

    const result = await getProducts(filter);

    expect(result.products).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.products[0].name).toEqual('Office Laptop');
    expect(result.products[0].price).toEqual(699.99);
    expect(result.products[0].category_id).toEqual(categories[0].id);
  });

  it('should use default pagination values when filter is not provided', async () => {
    // Create test category
    const [category] = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic products'
      })
      .returning()
      .execute();

    // Create one test product
    await db.insert(productsTable)
      .values({
        name: 'Test Product',
        code: 'TEST001',
        description: 'A test product',
        price: '99.99',
        stock: 10,
        category_id: category.id,
        image: null
      })
      .execute();

    const result = await getProducts();

    expect(result.products).toHaveLength(1);
    expect(result.total).toEqual(1);
    expect(result.products[0].name).toEqual('Test Product');
  });
});