import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { shipmentsTable, ordersTable, usersTable } from '../db/schema';
import { type CreateShipmentInput } from '../schema';
import { createShipment } from '../handlers/create_shipment';
import { eq } from 'drizzle-orm';

describe('createShipment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create prerequisite data
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestOrder = async (userId: number) => {
    const result = await db.insert(ordersTable)
      .values({
        user_id: userId,
        total_amount: '99.99',
        shipping_address: '123 Test St',
        shipping_method: 'standard',
        shipping_cost: '5.99'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a shipment with all required fields', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);

    const testInput: CreateShipmentInput = {
      order_id: order.id,
      courier: 'FedEx',
      cost: 15.50,
      estimated_delivery: new Date('2024-12-25')
    };

    const result = await createShipment(testInput);

    // Verify all fields are properly set
    expect(result.order_id).toEqual(order.id);
    expect(result.courier).toEqual('FedEx');
    expect(result.cost).toEqual(15.50);
    expect(typeof result.cost).toBe('number');
    expect(result.status).toEqual('pending');
    expect(result.estimated_delivery).toBeInstanceOf(Date);
    expect(result.estimated_delivery?.getTime()).toEqual(new Date('2024-12-25').getTime());
    expect(result.tracking_number).toBeNull();
    expect(result.delivered_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create shipment without estimated delivery', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);

    const testInput: CreateShipmentInput = {
      order_id: order.id,
      courier: 'UPS',
      cost: 12.00
    };

    const result = await createShipment(testInput);

    expect(result.order_id).toEqual(order.id);
    expect(result.courier).toEqual('UPS');
    expect(result.cost).toEqual(12.00);
    expect(result.estimated_delivery).toBeNull();
    expect(result.status).toEqual('pending');
  });

  it('should save shipment to database', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);

    const testInput: CreateShipmentInput = {
      order_id: order.id,
      courier: 'DHL',
      cost: 20.75,
      estimated_delivery: new Date('2024-12-30')
    };

    const result = await createShipment(testInput);

    // Verify shipment was saved to database
    const shipments = await db.select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, result.id))
      .execute();

    expect(shipments).toHaveLength(1);
    expect(shipments[0].order_id).toEqual(order.id);
    expect(shipments[0].courier).toEqual('DHL');
    expect(parseFloat(shipments[0].cost)).toEqual(20.75);
    expect(shipments[0].estimated_delivery).toBeInstanceOf(Date);
    expect(shipments[0].status).toEqual('pending');
  });

  it('should update order status to shipped', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);

    // Verify order starts with default status
    expect(order.status).toEqual('pending');

    const testInput: CreateShipmentInput = {
      order_id: order.id,
      courier: 'USPS',
      cost: 8.99
    };

    await createShipment(testInput);

    // Verify order status was updated to 'shipped'
    const updatedOrder = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, order.id))
      .execute();

    expect(updatedOrder).toHaveLength(1);
    expect(updatedOrder[0].status).toEqual('shipped');
    expect(updatedOrder[0].updated_at).toBeInstanceOf(Date);
    expect(updatedOrder[0].updated_at.getTime()).toBeGreaterThan(order.updated_at.getTime());
  });

  it('should throw error for non-existent order', async () => {
    const testInput: CreateShipmentInput = {
      order_id: 99999, // Non-existent order ID
      courier: 'FedEx',
      cost: 15.00
    };

    await expect(createShipment(testInput)).rejects.toThrow(/order not found/i);
  });

  it('should handle decimal costs correctly', async () => {
    const user = await createTestUser();
    const order = await createTestOrder(user.id);

    const testInput: CreateShipmentInput = {
      order_id: order.id,
      courier: 'Express Courier',
      cost: 25.99
    };

    const result = await createShipment(testInput);

    expect(result.cost).toEqual(25.99);
    expect(typeof result.cost).toBe('number');

    // Verify precision is maintained in database
    const savedShipment = await db.select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, result.id))
      .execute();

    expect(parseFloat(savedShipment[0].cost)).toEqual(25.99);
  });

  it('should create multiple shipments for different orders', async () => {
    const user = await createTestUser();
    const order1 = await createTestOrder(user.id);
    const order2 = await createTestOrder(user.id);

    const shipment1Input: CreateShipmentInput = {
      order_id: order1.id,
      courier: 'FedEx',
      cost: 10.00
    };

    const shipment2Input: CreateShipmentInput = {
      order_id: order2.id,
      courier: 'UPS',
      cost: 15.00
    };

    const result1 = await createShipment(shipment1Input);
    const result2 = await createShipment(shipment2Input);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.order_id).toEqual(order1.id);
    expect(result2.order_id).toEqual(order2.id);
    expect(result1.courier).toEqual('FedEx');
    expect(result2.courier).toEqual('UPS');

    // Verify both orders were updated to 'shipped'
    const orders = await db.select()
      .from(ordersTable)
      .execute();

    const updatedOrder1 = orders.find(o => o.id === order1.id);
    const updatedOrder2 = orders.find(o => o.id === order2.id);

    expect(updatedOrder1?.status).toEqual('shipped');
    expect(updatedOrder2?.status).toEqual('shipped');
  });
});