import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable, shipmentsTable } from '../db/schema';
import { type UpdateShipmentInput } from '../schema';
import { updateShipment } from '../handlers/update_shipment';
import { eq } from 'drizzle-orm';

// Test setup data
const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'Customer' as const
};

const testCategory = {
  name: 'Electronics',
  description: 'Electronic devices'
};

const testProduct = {
  name: 'Test Product',
  code: 'TEST001',
  description: 'A test product',
  price: '29.99',
  stock: 50,
  category_id: 1
};

const testOrder = {
  user_id: 1,
  total_amount: '100.00',
  status: 'paid' as const,
  shipping_address: '123 Test St',
  shipping_method: 'Standard',
  shipping_cost: '10.00',
  payment_method: 'Credit Card'
};

const testShipment = {
  order_id: 1,
  courier: 'DHL',
  cost: '15.50',
  status: 'pending' as const,
  estimated_delivery: new Date('2024-01-15')
};

describe('updateShipment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update shipment tracking number', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(productsTable).values(testProduct).execute();
    await db.insert(ordersTable).values(testOrder).execute();
    const [shipment] = await db.insert(shipmentsTable).values(testShipment).returning().execute();

    const input: UpdateShipmentInput = {
      id: shipment.id,
      tracking_number: 'DHL123456789'
    };

    const result = await updateShipment(input);

    expect(result.id).toEqual(shipment.id);
    expect(result.tracking_number).toEqual('DHL123456789');
    expect(result.status).toEqual('pending');
    expect(result.cost).toEqual(15.50);
    expect(typeof result.cost).toEqual('number');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update shipment status', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(productsTable).values(testProduct).execute();
    await db.insert(ordersTable).values(testOrder).execute();
    const [shipment] = await db.insert(shipmentsTable).values(testShipment).returning().execute();

    const input: UpdateShipmentInput = {
      id: shipment.id,
      status: 'in_transit'
    };

    const result = await updateShipment(input);

    expect(result.id).toEqual(shipment.id);
    expect(result.status).toEqual('in_transit');
    expect(result.courier).toEqual('DHL');
    expect(result.cost).toEqual(15.50);
    expect(typeof result.cost).toEqual('number');
  });

  it('should update delivery date', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(productsTable).values(testProduct).execute();
    await db.insert(ordersTable).values(testOrder).execute();
    const [shipment] = await db.insert(shipmentsTable).values(testShipment).returning().execute();

    const deliveryDate = new Date('2024-01-10T10:30:00Z');
    const input: UpdateShipmentInput = {
      id: shipment.id,
      delivered_at: deliveryDate
    };

    const result = await updateShipment(input);

    expect(result.id).toEqual(shipment.id);
    expect(result.delivered_at).toEqual(deliveryDate);
    expect(result.status).toEqual('pending'); // Status not changed
  });

  it('should update multiple fields at once', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(productsTable).values(testProduct).execute();
    await db.insert(ordersTable).values(testOrder).execute();
    const [shipment] = await db.insert(shipmentsTable).values(testShipment).returning().execute();

    const deliveryDate = new Date('2024-01-12T14:45:00Z');
    const input: UpdateShipmentInput = {
      id: shipment.id,
      tracking_number: 'DHL987654321',
      status: 'in_transit',
      delivered_at: deliveryDate
    };

    const result = await updateShipment(input);

    expect(result.id).toEqual(shipment.id);
    expect(result.tracking_number).toEqual('DHL987654321');
    expect(result.status).toEqual('in_transit');
    expect(result.delivered_at).toEqual(deliveryDate);
    expect(result.cost).toEqual(15.50);
    expect(typeof result.cost).toEqual('number');
  });

  it('should update order status to completed when shipment is delivered', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(productsTable).values(testProduct).execute();
    const [order] = await db.insert(ordersTable).values(testOrder).returning().execute();
    const [shipment] = await db.insert(shipmentsTable).values(testShipment).returning().execute();

    const input: UpdateShipmentInput = {
      id: shipment.id,
      status: 'delivered',
      delivered_at: new Date()
    };

    const result = await updateShipment(input);

    expect(result.status).toEqual('delivered');

    // Verify order status was updated to completed
    const [updatedOrder] = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, order.id))
      .execute();

    expect(updatedOrder.status).toEqual('completed');
    expect(updatedOrder.updated_at).toBeInstanceOf(Date);
  });

  it('should save changes to database', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(productsTable).values(testProduct).execute();
    await db.insert(ordersTable).values(testOrder).execute();
    const [shipment] = await db.insert(shipmentsTable).values(testShipment).returning().execute();

    const input: UpdateShipmentInput = {
      id: shipment.id,
      tracking_number: 'UPS123456789',
      status: 'in_transit'
    };

    await updateShipment(input);

    // Verify changes were saved to database
    const [updatedShipment] = await db.select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.id, shipment.id))
      .execute();

    expect(updatedShipment.tracking_number).toEqual('UPS123456789');
    expect(updatedShipment.status).toEqual('in_transit');
    expect(updatedShipment.updated_at).toBeInstanceOf(Date);
    expect(parseFloat(updatedShipment.cost)).toEqual(15.50);
  });

  it('should handle null tracking number', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(productsTable).values(testProduct).execute();
    await db.insert(ordersTable).values(testOrder).execute();
    
    // Create shipment with tracking number first
    const shipmentWithTracking = {
      ...testShipment,
      tracking_number: 'EXISTING123'
    };
    const [shipment] = await db.insert(shipmentsTable).values(shipmentWithTracking).returning().execute();

    const input: UpdateShipmentInput = {
      id: shipment.id,
      tracking_number: null
    };

    const result = await updateShipment(input);

    expect(result.tracking_number).toBeNull();
    expect(result.status).toEqual('pending');
  });

  it('should throw error for non-existent shipment', async () => {
    const input: UpdateShipmentInput = {
      id: 999,
      status: 'delivered'
    };

    await expect(updateShipment(input)).rejects.toThrow(/Shipment with id 999 not found/);
  });

  it('should update only specified fields', async () => {
    // Create prerequisite data
    await db.insert(usersTable).values(testUser).execute();
    await db.insert(categoriesTable).values(testCategory).execute();
    await db.insert(productsTable).values(testProduct).execute();
    await db.insert(ordersTable).values(testOrder).execute();
    
    const initialShipment = {
      ...testShipment,
      tracking_number: 'INITIAL123',
      status: 'in_transit' as const
    };
    const [shipment] = await db.insert(shipmentsTable).values(initialShipment).returning().execute();

    // Only update tracking number
    const input: UpdateShipmentInput = {
      id: shipment.id,
      tracking_number: 'UPDATED456'
    };

    const result = await updateShipment(input);

    expect(result.tracking_number).toEqual('UPDATED456');
    expect(result.status).toEqual('in_transit'); // Should remain unchanged
    expect(result.courier).toEqual('DHL'); // Should remain unchanged
  });
});