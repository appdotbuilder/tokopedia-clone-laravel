import { db } from '../db';
import { ordersTable, usersTable } from '../db/schema';
import { type Order } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export async function getOrderById(id: number, userId?: number): Promise<Order | null> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [eq(ordersTable.id, id)];

    // Add user access control if userId is provided
    if (userId) {
      // Customer users can only access their own orders
      conditions.push(eq(ordersTable.user_id, userId));
    }

    // Build and execute query
    const query = db.select()
      .from(ordersTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions));

    const results = await query.execute();

    if (results.length === 0) {
      return null;
    }

    const order = results[0];

    // Convert numeric fields back to numbers
    return {
      ...order,
      total_amount: parseFloat(order.total_amount),
      shipping_cost: parseFloat(order.shipping_cost)
    };
  } catch (error) {
    console.error('Get order by ID failed:', error);
    throw error;
  }
}