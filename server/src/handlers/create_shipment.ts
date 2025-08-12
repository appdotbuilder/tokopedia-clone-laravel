import { db } from '../db';
import { shipmentsTable, ordersTable } from '../db/schema';
import { type CreateShipmentInput, type Shipment } from '../schema';
import { eq } from 'drizzle-orm';

export const createShipment = async (input: CreateShipmentInput): Promise<Shipment> => {
  try {
    // Verify the order exists before creating shipment
    const existingOrder = await db.select()
      .from(ordersTable)
      .where(eq(ordersTable.id, input.order_id))
      .execute();

    if (existingOrder.length === 0) {
      throw new Error('Order not found');
    }

    // Insert shipment record
    const result = await db.insert(shipmentsTable)
      .values({
        order_id: input.order_id,
        courier: input.courier,
        cost: input.cost.toString(), // Convert number to string for numeric column
        estimated_delivery: input.estimated_delivery
      })
      .returning()
      .execute();

    // Update order status to 'shipped' when shipment is created
    await db.update(ordersTable)
      .set({ 
        status: 'shipped',
        updated_at: new Date()
      })
      .where(eq(ordersTable.id, input.order_id))
      .execute();

    // Convert numeric fields back to numbers before returning
    const shipment = result[0];
    return {
      ...shipment,
      cost: parseFloat(shipment.cost) // Convert string back to number
    };
  } catch (error) {
    console.error('Shipment creation failed:', error);
    throw error;
  }
};