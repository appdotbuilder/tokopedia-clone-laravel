import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, categoriesTable, productsTable, ordersTable } from '../db/schema';
import { type UpdateOrderInput } from '../schema';
import { updateOrder } from '../handlers/update_order';
import { eq } from 'drizzle-orm';

describe('updateOrder', () => {
  let testUserId: number;
  let testOrderId: number;

  beforeEach(async () => {
    await createDB();

    // Create test user
    const users = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer'
      })
      .returning()
      .execute();
    testUserId = users[0].id;

    // Create test order
    const orders = await db.insert(ordersTable)
      .values({
        user_id: testUserId,
        total_amount: '199.99',
        status: 'pending',
        shipping_address: '123 Test St',
        shipping_method: 'Standard',
        shipping_cost: '10.00',
        payment_method: 'Credit Card',
        payment_status: 'pending'
      })
      .returning()
      .execute();
    testOrderId = orders[0].id;
  });

  afterEach(resetDB);

  it('should update order status', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      status: 'paid'
    };

    const result = await updateOrder(input);

    expect(result.id).toEqual(testOrderId);
    expect(result.status).toEqual('paid');
    expect(result.user_id).toEqual(testUserId);
    expect(result.total_amount).toEqual(199.99);
    expect(result.shipping_cost).toEqual(10.00);
    expect(result.payment_status).toEqual('pending'); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update payment status', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      payment_status: 'completed'
    };

    const result = await updateOrder(input);

    expect(result.id).toEqual(testOrderId);
    expect(result.status).toEqual('pending'); // Unchanged
    expect(result.payment_status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only payment status when provided', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      payment_status: 'completed'
    };

    const result = await updateOrder(input);

    expect(result.id).toEqual(testOrderId);
    expect(result.payment_status).toEqual('completed');
    expect(result.status).toEqual('pending'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update multiple fields simultaneously', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      status: 'shipped',
      payment_status: 'completed'
    };

    const result = await updateOrder(input);

    expect(result.id).toEqual(testOrderId);
    expect(result.status).toEqual('shipped');
    expect(result.payment_status).toEqual('completed');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save updates to database', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      status: 'completed',
      payment_status: 'paid'
    };

    await updateOrder(input);

    // Verify changes were saved to database
    const orders = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, testOrderId))
      .execute();

    expect(orders).toHaveLength(1);
    expect(orders[0].status).toEqual('completed');
    expect(orders[0].payment_status).toEqual('paid');
    expect(orders[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle status transitions correctly', async () => {
    // Test valid status transitions using proper enum types
    const transitions = [
      { from: 'pending' as const, to: 'paid' as const },
      { from: 'paid' as const, to: 'shipped' as const },
      { from: 'shipped' as const, to: 'completed' as const }
    ];

    for (const transition of transitions) {
      // Set initial status
      await db.update(ordersTable)
        .set({ status: transition.from })
        .where(eq(ordersTable.id, testOrderId))
        .execute();

      // Update to new status
      const result = await updateOrder({
        id: testOrderId,
        status: transition.to
      });

      expect(result.status).toEqual(transition.to);
    }
  });

  it('should handle cancelled status', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      status: 'cancelled' as const
    };

    const result = await updateOrder(input);

    expect(result.status).toEqual('cancelled');
  });

  it('should preserve numeric field types', async () => {
    const result = await updateOrder({
      id: testOrderId,
      status: 'paid'
    });

    expect(typeof result.total_amount).toEqual('number');
    expect(typeof result.shipping_cost).toEqual('number');
    expect(result.total_amount).toEqual(199.99);
    expect(result.shipping_cost).toEqual(10.00);
  });

  it('should throw error for non-existent order', async () => {
    const input: UpdateOrderInput = {
      id: 99999,
      status: 'paid'
    };

    expect(updateOrder(input)).rejects.toThrow(/Order with id 99999 not found/i);
  });

  it('should always update updated_at timestamp', async () => {
    const beforeUpdate = new Date();
    
    const result = await updateOrder({
      id: testOrderId,
      status: 'paid'
    });

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
  });

  it('should handle partial updates with minimal input', async () => {
    const input: UpdateOrderInput = {
      id: testOrderId,
      status: 'shipped' as const
    };

    const result = await updateOrder(input);

    // Should only change status, leaving other fields unchanged
    expect(result.status).toEqual('shipped');
    expect(result.payment_status).toEqual('pending');
    expect(result.shipping_address).toEqual('123 Test St');
    expect(result.shipping_method).toEqual('Standard');
  });
});