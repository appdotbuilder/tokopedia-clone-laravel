import { db } from '../db';
import { shipmentsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Shipment } from '../schema';

export const trackShipment = async (orderId: number): Promise<Shipment | null> => {
  try {
    // Query shipment by order ID
    const results = await db.select()
      .from(shipmentsTable)
      .where(eq(shipmentsTable.order_id, orderId))
      .execute();

    if (results.length === 0) {
      return null;
    }

    // Convert numeric fields back to numbers for the first result
    const shipment = results[0];
    return {
      ...shipment,
      cost: parseFloat(shipment.cost)
    };
  } catch (error) {
    console.error('Shipment tracking failed:', error);
    throw error;
  }
};