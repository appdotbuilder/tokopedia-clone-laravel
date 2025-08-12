import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable, shipmentsTable } from '../db/schema';
import { trackShipment } from '../handlers/track_shipment';

describe('trackShipment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return shipment information for existing order', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();

    const [category] = await db.insert(categoriesTable).values({
      name: 'Electronics',
      description: 'Electronic products'
    }).returning().execute();

    const [product] = await db.insert(productsTable).values({
      name: 'Test Product',
      code: 'PROD001',
      description: 'A test product',
      price: '99.99',
      stock: 10,
      category_id: category.id
    }).returning().execute();

    const [order] = await db.insert(ordersTable).values({
      user_id: user.id,
      total_amount: '99.99',
      status: 'paid',
      shipping_address: '123 Main St, City, State 12345',
      shipping_method: 'Standard Shipping',
      shipping_cost: '10.00',
      payment_method: 'Credit Card'
    }).returning().execute();

    // Create shipment
    const testShipment = {
      order_id: order.id,
      courier: 'DHL Express',
      tracking_number: 'DHL123456789',
      cost: '15.50',
      status: 'in_transit' as const,
      estimated_delivery: new Date('2024-12-25')
    };

    const [createdShipment] = await db.insert(shipmentsTable).values(testShipment).returning().execute();

    // Test tracking
    const result = await trackShipment(order.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdShipment.id);
    expect(result!.order_id).toEqual(order.id);
    expect(result!.courier).toEqual('DHL Express');
    expect(result!.tracking_number).toEqual('DHL123456789');
    expect(result!.cost).toEqual(15.50);
    expect(typeof result!.cost).toEqual('number');
    expect(result!.status).toEqual('in_transit');
    expect(result!.estimated_delivery).toBeInstanceOf(Date);
    expect(result!.delivered_at).toBeNull();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent order', async () => {
    const result = await trackShipment(99999);

    expect(result).toBeNull();
  });

  it('should return null for order without shipment', async () => {
    // Create user and order without shipment
    const [user] = await db.insert(usersTable).values({
      name: 'Test User',
      email: 'user@example.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();

    const [order] = await db.insert(ordersTable).values({
      user_id: user.id,
      total_amount: '50.00',
      status: 'pending',
      shipping_address: '456 Oak Ave, City, State 67890',
      shipping_method: 'Express Shipping',
      shipping_cost: '15.00'
    }).returning().execute();

    const result = await trackShipment(order.id);

    expect(result).toBeNull();
  });

  it('should handle shipment with delivered status', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values({
      name: 'Delivered User',
      email: 'delivered@example.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();

    const [order] = await db.insert(ordersTable).values({
      user_id: user.id,
      total_amount: '199.99',
      status: 'completed',
      shipping_address: '789 Pine St, City, State 54321',
      shipping_method: 'Next Day Delivery',
      shipping_cost: '25.00',
      payment_method: 'PayPal'
    }).returning().execute();

    const deliveryDate = new Date('2024-01-15');
    const estimatedDate = new Date('2024-01-14');

    // Create delivered shipment
    const [deliveredShipment] = await db.insert(shipmentsTable).values({
      order_id: order.id,
      courier: 'FedEx',
      tracking_number: 'FDX987654321',
      cost: '25.00',
      status: 'delivered',
      estimated_delivery: estimatedDate,
      delivered_at: deliveryDate
    }).returning().execute();

    const result = await trackShipment(order.id);

    expect(result).not.toBeNull();
    expect(result!.status).toEqual('delivered');
    expect(result!.delivered_at).toBeInstanceOf(Date);
    expect(result!.delivered_at).toEqual(deliveryDate);
    expect(result!.estimated_delivery).toEqual(estimatedDate);
    expect(result!.courier).toEqual('FedEx');
    expect(result!.tracking_number).toEqual('FDX987654321');
  });

  it('should handle shipment without tracking number', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values({
      name: 'No Tracking User',
      email: 'notracking@example.com',
      password: 'password123',
      role: 'Admin'
    }).returning().execute();

    const [order] = await db.insert(ordersTable).values({
      user_id: user.id,
      total_amount: '75.00',
      status: 'shipped',
      shipping_address: '321 Elm St, City, State 98765',
      shipping_method: 'Ground Shipping',
      shipping_cost: '5.00'
    }).returning().execute();

    // Create shipment without tracking number
    await db.insert(shipmentsTable).values({
      order_id: order.id,
      courier: 'UPS',
      tracking_number: null,
      cost: '5.00',
      status: 'pending'
    }).execute();

    const result = await trackShipment(order.id);

    expect(result).not.toBeNull();
    expect(result!.tracking_number).toBeNull();
    expect(result!.courier).toEqual('UPS');
    expect(result!.status).toEqual('pending');
    expect(result!.cost).toEqual(5.00);
    expect(typeof result!.cost).toEqual('number');
  });

  it('should return first shipment if multiple exist for same order', async () => {
    // Create prerequisite data
    const [user] = await db.insert(usersTable).values({
      name: 'Multi Shipment User',
      email: 'multi@example.com',
      password: 'password123',
      role: 'Customer'
    }).returning().execute();

    const [order] = await db.insert(ordersTable).values({
      user_id: user.id,
      total_amount: '150.00',
      status: 'shipped',
      shipping_address: '654 Maple Dr, City, State 13579',
      shipping_method: 'Split Shipment',
      shipping_cost: '20.00'
    }).returning().execute();

    // Create multiple shipments for same order
    const [firstShipment] = await db.insert(shipmentsTable).values({
      order_id: order.id,
      courier: 'USPS',
      tracking_number: 'USPS111111111',
      cost: '10.00',
      status: 'in_transit'
    }).returning().execute();

    await db.insert(shipmentsTable).values({
      order_id: order.id,
      courier: 'DHL',
      tracking_number: 'DHL222222222',
      cost: '10.00',
      status: 'pending'
    }).execute();

    const result = await trackShipment(order.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(firstShipment.id);
    expect(result!.tracking_number).toEqual('USPS111111111');
    expect(result!.courier).toEqual('USPS');
  });
});