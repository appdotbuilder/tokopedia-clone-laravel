import { db } from '../db';
import { usersTable, productsTable, ordersTable, orderItemsTable } from '../db/schema';
import { count, sum, desc, eq, lte } from 'drizzle-orm';

interface RecentOrder {
  id: number;
  user_id: number;
  total_amount: number;
  status: string;
  created_at: Date;
}

interface TopSellingProduct {
  product_id: number;
  name: string;
  total_quantity: number;
  total_revenue: number;
}

interface DashboardStats {
  total_users: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  low_stock_products: number;
  recent_orders: RecentOrder[];
  top_selling_products: TopSellingProduct[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total users count
    const totalUsersResult = await db
      .select({ count: count() })
      .from(usersTable)
      .execute();
    const total_users = totalUsersResult[0].count;

    // Get total products count
    const totalProductsResult = await db
      .select({ count: count() })
      .from(productsTable)
      .execute();
    const total_products = totalProductsResult[0].count;

    // Get total orders count
    const totalOrdersResult = await db
      .select({ count: count() })
      .from(ordersTable)
      .execute();
    const total_orders = totalOrdersResult[0].count;

    // Get total revenue (sum of all order amounts)
    const totalRevenueResult = await db
      .select({ total: sum(ordersTable.total_amount) })
      .from(ordersTable)
      .execute();
    const total_revenue = totalRevenueResult[0].total ? parseFloat(totalRevenueResult[0].total) : 0;

    // Get pending orders count
    const pendingOrdersResult = await db
      .select({ count: count() })
      .from(ordersTable)
      .where(eq(ordersTable.status, 'pending'))
      .execute();
    const pending_orders = pendingOrdersResult[0].count;

    // Get low stock products count (stock <= 10)
    const lowStockProductsResult = await db
      .select({ count: count() })
      .from(productsTable)
      .where(lte(productsTable.stock, 10))
      .execute();
    const low_stock_products = lowStockProductsResult[0].count;

    // Get recent orders (last 10)
    const recentOrdersResult = await db
      .select({
        id: ordersTable.id,
        user_id: ordersTable.user_id,
        total_amount: ordersTable.total_amount,
        status: ordersTable.status,
        created_at: ordersTable.created_at
      })
      .from(ordersTable)
      .orderBy(desc(ordersTable.created_at))
      .limit(10)
      .execute();

    const recent_orders: RecentOrder[] = recentOrdersResult.map(order => ({
      id: order.id,
      user_id: order.user_id,
      total_amount: parseFloat(order.total_amount),
      status: order.status,
      created_at: order.created_at
    }));

    // Get top selling products (by quantity sold)
    const topSellingProductsResult = await db
      .select({
        product_id: orderItemsTable.product_id,
        name: productsTable.name,
        total_quantity: sum(orderItemsTable.quantity),
        total_revenue: sum(orderItemsTable.price)
      })
      .from(orderItemsTable)
      .innerJoin(productsTable, eq(orderItemsTable.product_id, productsTable.id))
      .groupBy(orderItemsTable.product_id, productsTable.name)
      .orderBy(desc(sum(orderItemsTable.quantity)))
      .limit(5)
      .execute();

    const top_selling_products: TopSellingProduct[] = topSellingProductsResult.map(product => ({
      product_id: product.product_id,
      name: product.name,
      total_quantity: Number(product.total_quantity) || 0,
      total_revenue: parseFloat(product.total_revenue || '0')
    }));

    return {
      total_users,
      total_products,
      total_orders,
      total_revenue,
      pending_orders,
      low_stock_products,
      recent_orders,
      top_selling_products
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
}