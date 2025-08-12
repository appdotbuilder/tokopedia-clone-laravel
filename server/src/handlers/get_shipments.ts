import { db } from '../db';
import { shipmentsTable, ordersTable, usersTable } from '../db/schema';
import { type Shipment } from '../schema';
import { eq } from 'drizzle-orm';

export const getShipments = async (): Promise<Shipment[]> => {
  try {
    // Fetch all shipments with order and user information
    const results = await db.select()
      .from(shipmentsTable)
      .innerJoin(ordersTable, eq(shipmentsTable.order_id, ordersTable.id))
      .innerJoin(usersTable, eq(ordersTable.user_id, usersTable.id))
      .execute();

    // Transform the joined results and convert numeric fields
    return results.map(result => ({
      id: result.shipments.id,
      order_id: result.shipments.order_id,
      courier: result.shipments.courier,
      tracking_number: result.shipments.tracking_number,
      cost: parseFloat(result.shipments.cost), // Convert numeric to number
      status: result.shipments.status,
      estimated_delivery: result.shipments.estimated_delivery,
      delivered_at: result.shipments.delivered_at,
      created_at: result.shipments.created_at,
      updated_at: result.shipments.updated_at
    }));
  } catch (error) {
    console.error('Failed to fetch shipments:', error);
    throw error;
  }
};