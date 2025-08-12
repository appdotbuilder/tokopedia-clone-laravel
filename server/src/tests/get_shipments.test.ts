import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable, shipmentsTable } from '../db/schema';
import { getShipments } from '../handlers/get_shipments';
import { type CreateUserInput, type CreateCategoryInput, type CreateProductInput } from '../schema';

// Test data setup
const testUser: CreateUserInput = {
  name: 'Test Customer',
  email: 'test@example.com',
  password: 'password123',
  role: 'Customer',
  address: '123 Test St',
  phone: '+1234567890'
};

const testCategory: CreateCategoryInput = {
  name: 'Electronics',
  description: 'Electronic products'
};

const testProduct: CreateProductInput = {
  name: 'Test Product',
  code: 'TEST001',
  description: 'A test product',
  price: 99.99,
  stock: 50,
  category_id: 1, // Will be set after category creation
  image: 'test-image.jpg'
};

describe('getShipments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no shipments exist', async () => {
    const result = await getShipments();
    
    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return all shipments with correct data structure', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        role: testUser.role,
        address: testUser.address,
        phone: testUser.phone
      })
      .returning()
      .execute();

    const [category] = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .returning()
      .execute();

    const [product] = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        code: testProduct.code,
        description: testProduct.description,
        price: testProduct.price.toString(),
        stock: testProduct.stock,
        category_id: category.id,
        image: testProduct.image
      })
      .returning()
      .execute();

    const [order] = await db.insert(ordersTable)
      .values({
        user_id: user.id,
        total_amount: '199.98',
        status: 'paid',
        shipping_address: '123 Test St',
        shipping_method: 'Standard',
        shipping_cost: '9.99',
        payment_method: 'credit_card'
      })
      .returning()
      .execute();

    const [shipment] = await db.insert(shipmentsTable)
      .values({
        order_id: order.id,
        courier: 'FedEx',
        tracking_number: 'FDX123456789',
        cost: '15.50',
        status: 'in_transit',
        estimated_delivery: new Date('2024-01-15')
      })
      .returning()
      .execute();

    const result = await getShipments();

    expect(result).toHaveLength(1);
    
    const returnedShipment = result[0];
    expect(returnedShipment.id).toBe(shipment.id);
    expect(returnedShipment.order_id).toBe(order.id);
    expect(returnedShipment.courier).toBe('FedEx');
    expect(returnedShipment.tracking_number).toBe('FDX123456789');
    expect(returnedShipment.cost).toBe(15.50); // Should be converted to number
    expect(typeof returnedShipment.cost).toBe('number');
    expect(returnedShipment.status).toBe('in_transit');
    expect(returnedShipment.estimated_delivery).toBeInstanceOf(Date);
    expect(returnedShipment.delivered_at).toBeNull();
    expect(returnedShipment.created_at).toBeInstanceOf(Date);
    expect(returnedShipment.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple shipments with different statuses', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        role: testUser.role,
        address: testUser.address,
        phone: testUser.phone
      })
      .returning()
      .execute();

    const [category] = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .returning()
      .execute();

    const [product] = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        code: testProduct.code,
        description: testProduct.description,
        price: testProduct.price.toString(),
        stock: testProduct.stock,
        category_id: category.id,
        image: testProduct.image
      })
      .returning()
      .execute();

    // Create two orders
    const [order1] = await db.insert(ordersTable)
      .values({
        user_id: user.id,
        total_amount: '99.99',
        status: 'paid',
        shipping_address: '123 Test St',
        shipping_method: 'Standard',
        shipping_cost: '5.99'
      })
      .returning()
      .execute();

    const [order2] = await db.insert(ordersTable)
      .values({
        user_id: user.id,
        total_amount: '199.98',
        status: 'shipped',
        shipping_address: '456 Another St',
        shipping_method: 'Express',
        shipping_cost: '15.99'
      })
      .returning()
      .execute();

    // Create two shipments with different statuses
    await db.insert(shipmentsTable)
      .values([
        {
          order_id: order1.id,
          courier: 'UPS',
          tracking_number: 'UPS123456',
          cost: '12.50',
          status: 'pending'
        },
        {
          order_id: order2.id,
          courier: 'DHL',
          tracking_number: 'DHL789012',
          cost: '18.75',
          status: 'delivered',
          delivered_at: new Date('2024-01-10')
        }
      ])
      .execute();

    const result = await getShipments();

    expect(result).toHaveLength(2);
    
    // Verify both shipments are returned with correct data
    const pendingShipment = result.find(s => s.status === 'pending');
    const deliveredShipment = result.find(s => s.status === 'delivered');

    expect(pendingShipment).toBeDefined();
    expect(pendingShipment!.courier).toBe('UPS');
    expect(pendingShipment!.cost).toBe(12.50);
    expect(typeof pendingShipment!.cost).toBe('number');

    expect(deliveredShipment).toBeDefined();
    expect(deliveredShipment!.courier).toBe('DHL');
    expect(deliveredShipment!.cost).toBe(18.75);
    expect(typeof deliveredShipment!.cost).toBe('number');
    expect(deliveredShipment!.delivered_at).toBeInstanceOf(Date);
  });

  it('should handle shipments with null tracking numbers and dates', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
        role: testUser.role
      })
      .returning()
      .execute();

    const [category] = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .returning()
      .execute();

    const [product] = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        code: testProduct.code,
        description: testProduct.description,
        price: testProduct.price.toString(),
        stock: testProduct.stock,
        category_id: category.id
      })
      .returning()
      .execute();

    const [order] = await db.insert(ordersTable)
      .values({
        user_id: user.id,
        total_amount: '50.00',
        status: 'pending',
        shipping_address: '789 Test Ave',
        shipping_method: 'Standard',
        shipping_cost: '0.00'
      })
      .returning()
      .execute();

    await db.insert(shipmentsTable)
      .values({
        order_id: order.id,
        courier: 'Local Delivery',
        cost: '5.00',
        status: 'pending'
        // tracking_number, estimated_delivery, delivered_at will be null
      })
      .execute();

    const result = await getShipments();

    expect(result).toHaveLength(1);
    
    const shipment = result[0];
    expect(shipment.courier).toBe('Local Delivery');
    expect(shipment.tracking_number).toBeNull();
    expect(shipment.estimated_delivery).toBeNull();
    expect(shipment.delivered_at).toBeNull();
    expect(shipment.cost).toBe(5.00);
    expect(typeof shipment.cost).toBe('number');
  });

  it('should verify join relationships work correctly', async () => {
    // Create multiple users and orders to ensure joins work correctly
    const [user1] = await db.insert(usersTable)
      .values({
        name: 'User One',
        email: 'user1@test.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const [user2] = await db.insert(usersTable)
      .values({
        name: 'User Two',
        email: 'user2@test.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();

    const [category] = await db.insert(categoriesTable)
      .values({
        name: testCategory.name,
        description: testCategory.description
      })
      .returning()
      .execute();

    const [product] = await db.insert(productsTable)
      .values({
        name: testProduct.name,
        code: testProduct.code,
        description: testProduct.description,
        price: testProduct.price.toString(),
        stock: testProduct.stock,
        category_id: category.id
      })
      .returning()
      .execute();

    const [order1] = await db.insert(ordersTable)
      .values({
        user_id: user1.id,
        total_amount: '100.00',
        status: 'paid',
        shipping_address: 'Address 1',
        shipping_method: 'Standard',
        shipping_cost: '10.00'
      })
      .returning()
      .execute();

    const [order2] = await db.insert(ordersTable)
      .values({
        user_id: user2.id,
        total_amount: '200.00',
        status: 'shipped',
        shipping_address: 'Address 2',
        shipping_method: 'Express',
        shipping_cost: '20.00'
      })
      .returning()
      .execute();

    await db.insert(shipmentsTable)
      .values([
        {
          order_id: order1.id,
          courier: 'Courier A',
          cost: '15.00',
          status: 'in_transit'
        },
        {
          order_id: order2.id,
          courier: 'Courier B',
          cost: '25.00',
          status: 'delivered'
        }
      ])
      .execute();

    const result = await getShipments();

    expect(result).toHaveLength(2);
    
    // Verify that shipments are correctly associated with their orders
    const shipment1 = result.find(s => s.order_id === order1.id);
    const shipment2 = result.find(s => s.order_id === order2.id);

    expect(shipment1).toBeDefined();
    expect(shipment1!.courier).toBe('Courier A');
    expect(shipment1!.cost).toBe(15.00);

    expect(shipment2).toBeDefined();
    expect(shipment2!.courier).toBe('Courier B');
    expect(shipment2!.cost).toBe(25.00);
  });
});