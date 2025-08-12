import { db } from '../db';
import { ordersTable } from '../db/schema';
import { type Order, type OrderFilter } from '../schema';
import { eq, gte, lte, and, count, desc, SQL } from 'drizzle-orm';

export async function getOrders(filter?: OrderFilter, userId?: number): Promise<{ orders: Order[], total: number }> {
  try {
    // Parse filter with defaults applied by Zod
    const {
      status,
      user_id: filterUserId,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = filter || {};

    const offset = (page - 1) * limit;

    // Build base query
    let query = db.select().from(ordersTable);
    let countQuery = db.select({ count: count() }).from(ordersTable);

    // Collect conditions
    const conditions: SQL<unknown>[] = [];

    // If userId is provided (user context), limit to their orders only
    // For admins, they can optionally filter by user_id, but don't restrict by default
    if (userId) {
      conditions.push(eq(ordersTable.user_id, userId));
    }

    // Admin can filter by specific user_id (if provided in filter)
    if (filterUserId && !userId) {
      conditions.push(eq(ordersTable.user_id, filterUserId));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(ordersTable.status, status));
    }

    // Filter by date range
    if (start_date) {
      conditions.push(gte(ordersTable.created_at, start_date));
    }

    if (end_date) {
      conditions.push(lte(ordersTable.created_at, end_date));
    }

    // Apply conditions to both queries
    if (conditions.length > 0) {
      const whereCondition = conditions.length === 1 ? conditions[0] : and(...conditions);
      query = query.where(whereCondition) as typeof query;
      countQuery = countQuery.where(whereCondition) as typeof countQuery;
    }

    // Apply ordering and pagination to main query
    query = query
      .orderBy(desc(ordersTable.created_at))
      .limit(limit)
      .offset(offset) as typeof query;

    // Execute both queries
    const [orders, totalResult] = await Promise.all([
      query.execute(),
      countQuery.execute()
    ]);

    // Convert numeric fields to numbers
    const formattedOrders = orders.map(order => ({
      ...order,
      total_amount: parseFloat(order.total_amount),
      shipping_cost: parseFloat(order.shipping_cost)
    }));

    return {
      orders: formattedOrders,
      total: totalResult[0].count
    };
  } catch (error) {
    console.error('Get orders failed:', error);
    throw error;
  }
}