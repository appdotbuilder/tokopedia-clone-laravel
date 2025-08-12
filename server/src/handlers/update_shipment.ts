import { db } from '../db';
import { shipmentsTable, ordersTable } from '../db/schema';
import { type UpdateShipmentInput, type Shipment } from '../schema';
import { eq } from 'drizzle-orm';

export const updateShipment = async (input: UpdateShipmentInput): Promise<Shipment> => {
  try {
    // Build the update data object
    const updateData: any = {};
    
    if (input.tracking_number !== undefined) {
      updateData.tracking_number = input.tracking_number;
    }
    
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    
    if (input.delivered_at !== undefined) {
      updateData.delivered_at = input.delivered_at;
    }
    
    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update the shipment record
    const result = await db.update(shipmentsTable)
      .set(updateData)
      .where(eq(shipmentsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Shipment with id ${input.id} not found`);
    }

    const updatedShipment = result[0];

    // If shipment status is updated to 'delivered', update the order status to 'completed'
    if (input.status === 'delivered') {
      await db.update(ordersTable)
        .set({ 
          status: 'completed',
          updated_at: new Date()
        })
        .where(eq(ordersTable.id, updatedShipment.order_id))
        .execute();
    }

    // Convert numeric fields back to numbers before returning
    return {
      ...updatedShipment,
      cost: parseFloat(updatedShipment.cost)
    };
  } catch (error) {
    console.error('Shipment update failed:', error);
    throw error;
  }
};