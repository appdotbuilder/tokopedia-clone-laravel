import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, cartItemsTable } from '../db/schema';
import { getCart, type CartItemWithDetails } from '../handlers/get_cart';

describe('getCart', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array for user with no cart items', async () => {
    // Create a user
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const result = await getCart(users[0].id);

    expect(result).toEqual([]);
  });

  it('should return cart items with product and category details', async () => {
    // Create prerequisites: user, category, products
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Electronics',
        description: 'Electronic devices'
      })
      .returning()
      .execute();

    const products = await db.insert(productsTable)
      .values([
        {
          name: 'Laptop',
          code: 'LAPTOP001',
          description: 'Gaming laptop',
          price: '999.99',
          stock: 10,
          category_id: categories[0].id
        },
        {
          name: 'Mouse',
          code: 'MOUSE001',
          description: 'Wireless mouse',
          price: '29.99',
          stock: 50,
          category_id: categories[0].id
        }
      ])
      .returning()
      .execute();

    // Add items to cart
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: users[0].id,
          product_id: products[0].id,
          quantity: 1
        },
        {
          user_id: users[0].id,
          product_id: products[1].id,
          quantity: 2
        }
      ])
      .execute();

    const result = await getCart(users[0].id);

    expect(result).toHaveLength(2);

    // Check first cart item (laptop)
    const laptopItem = result.find(item => item.product.name === 'Laptop');
    expect(laptopItem).toBeDefined();
    expect(laptopItem!.user_id).toBe(users[0].id);
    expect(laptopItem!.product_id).toBe(products[0].id);
    expect(laptopItem!.quantity).toBe(1);
    expect(laptopItem!.product.name).toBe('Laptop');
    expect(laptopItem!.product.code).toBe('LAPTOP001');
    expect(laptopItem!.product.price).toBe(999.99); // Converted to number
    expect(typeof laptopItem!.product.price).toBe('number');
    expect(laptopItem!.product.stock).toBe(10);
    expect(laptopItem!.category.name).toBe('Electronics');
    expect(laptopItem!.subtotal).toBe(999.99); // 999.99 * 1

    // Check second cart item (mouse)
    const mouseItem = result.find(item => item.product.name === 'Mouse');
    expect(mouseItem).toBeDefined();
    expect(mouseItem!.user_id).toBe(users[0].id);
    expect(mouseItem!.product_id).toBe(products[1].id);
    expect(mouseItem!.quantity).toBe(2);
    expect(mouseItem!.product.name).toBe('Mouse');
    expect(mouseItem!.product.code).toBe('MOUSE001');
    expect(mouseItem!.product.price).toBe(29.99); // Converted to number
    expect(typeof mouseItem!.product.price).toBe('number');
    expect(mouseItem!.product.stock).toBe(50);
    expect(mouseItem!.category.name).toBe('Electronics');
    expect(mouseItem!.subtotal).toBe(59.98); // 29.99 * 2

    // Verify timestamps exist
    expect(laptopItem!.created_at).toBeInstanceOf(Date);
    expect(laptopItem!.updated_at).toBeInstanceOf(Date);
    expect(laptopItem!.product.created_at).toBeInstanceOf(Date);
    expect(laptopItem!.product.updated_at).toBeInstanceOf(Date);
  });

  it('should only return cart items for the specified user', async () => {
    // Create two users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'User One',
          email: 'user1@example.com',
          password: 'password123',
          role: 'Customer'
        },
        {
          name: 'User Two',
          email: 'user2@example.com',
          password: 'password123',
          role: 'Customer'
        }
      ])
      .returning()
      .execute();

    // Create category and product
    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Books',
        description: 'Educational books'
      })
      .returning()
      .execute();

    const products = await db.insert(productsTable)
      .values({
        name: 'JavaScript Guide',
        code: 'BOOK001',
        description: 'Complete guide to JavaScript',
        price: '49.99',
        stock: 20,
        category_id: categories[0].id
      })
      .returning()
      .execute();

    // Add cart items for both users
    await db.insert(cartItemsTable)
      .values([
        {
          user_id: users[0].id,
          product_id: products[0].id,
          quantity: 1
        },
        {
          user_id: users[1].id,
          product_id: products[0].id,
          quantity: 3
        }
      ])
      .execute();

    // Get cart for first user
    const user1Cart = await getCart(users[0].id);
    expect(user1Cart).toHaveLength(1);
    expect(user1Cart[0].user_id).toBe(users[0].id);
    expect(user1Cart[0].quantity).toBe(1);

    // Get cart for second user
    const user2Cart = await getCart(users[1].id);
    expect(user2Cart).toHaveLength(1);
    expect(user2Cart[0].user_id).toBe(users[1].id);
    expect(user2Cart[0].quantity).toBe(3);
  });

  it('should calculate subtotals correctly for different quantities', async () => {
    // Create user, category, and product
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Accessories',
        description: 'Computer accessories'
      })
      .returning()
      .execute();

    const products = await db.insert(productsTable)
      .values({
        name: 'Keyboard',
        code: 'KB001',
        description: 'Mechanical keyboard',
        price: '79.50',
        stock: 15,
        category_id: categories[0].id
      })
      .returning()
      .execute();

    // Add cart item with quantity 3
    await db.insert(cartItemsTable)
      .values({
        user_id: users[0].id,
        product_id: products[0].id,
        quantity: 3
      })
      .execute();

    const result = await getCart(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].product.price).toBe(79.50);
    expect(result[0].quantity).toBe(3);
    expect(result[0].subtotal).toBe(238.50); // 79.50 * 3
  });

  it('should handle products with decimal prices correctly', async () => {
    // Create user, category, and product with precise decimal price
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const categories = await db.insert(categoriesTable)
      .values({
        name: 'Software',
        description: 'Software licenses'
      })
      .returning()
      .execute();

    const products = await db.insert(productsTable)
      .values({
        name: 'License',
        code: 'LIC001',
        description: 'Software license',
        price: '123.45',
        stock: 100,
        category_id: categories[0].id
      })
      .returning()
      .execute();

    await db.insert(cartItemsTable)
      .values({
        user_id: users[0].id,
        product_id: products[0].id,
        quantity: 2
      })
      .execute();

    const result = await getCart(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].product.price).toBe(123.45);
    expect(result[0].subtotal).toBe(246.90); // 123.45 * 2
    expect(typeof result[0].product.price).toBe('number');
    expect(typeof result[0].subtotal).toBe('number');
  });
});