import { db } from '../db';
import { cartItemsTable, ordersTable, orderItemsTable, productsTable } from '../db/schema';
import { type CheckoutInput, type Order } from '../schema';
import { eq, SQL } from 'drizzle-orm';

// Simple shipping cost calculator
const calculateShippingCost = (method: string, totalAmount: number): number => {
  switch (method.toLowerCase()) {
    case 'standard':
      return totalAmount > 100 ? 0 : 9.99; // Free shipping over $100
    case 'express':
      return 19.99;
    case 'overnight':
      return 39.99;
    default:
      return 9.99;
  }
};

export const checkout = async (input: CheckoutInput): Promise<Order> => {
  try {
    // Get cart items for the user with product details
    const cartItems = await db.select({
      id: cartItemsTable.id,
      user_id: cartItemsTable.user_id,
      product_id: cartItemsTable.product_id,
      quantity: cartItemsTable.quantity,
      product_price: productsTable.price,
      product_stock: productsTable.stock,
      product_name: productsTable.name
    })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.product_id, productsTable.id))
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    if (cartItems.length === 0) {
      throw new Error('Cart is empty');
    }

    // Validate stock availability and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of cartItems) {
      const productPrice = parseFloat(item.product_price);
      const availableStock = item.product_stock;

      if (item.quantity > availableStock) {
        throw new Error(`Insufficient stock for ${item.product_name}. Available: ${availableStock}, Requested: ${item.quantity}`);
      }

      const itemTotal = productPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        price: productPrice
      });
    }

    // Calculate shipping cost
    const shippingCost = calculateShippingCost(input.shipping_method, subtotal);
    const totalAmount = subtotal + shippingCost;

    // Create the order
    const orderResult = await db.insert(ordersTable)
      .values({
        user_id: input.user_id,
        total_amount: totalAmount.toString(),
        shipping_address: input.shipping_address,
        shipping_method: input.shipping_method,
        shipping_cost: shippingCost.toString(),
        payment_method: input.payment_method,
        payment_status: 'pending',
        status: 'pending'
      })
      .returning()
      .execute();

    const order = orderResult[0];

    // Create order items
    const orderItemsData = orderItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price.toString()
    }));

    await db.insert(orderItemsTable)
      .values(orderItemsData)
      .execute();

    // Update product stock
    for (const item of cartItems) {
      const newStock = item.product_stock - item.quantity;
      await db.update(productsTable)
        .set({ stock: newStock })
        .where(eq(productsTable.id, item.product_id))
        .execute();
    }

    // Clear the user's cart
    await db.delete(cartItemsTable)
      .where(eq(cartItemsTable.user_id, input.user_id))
      .execute();

    // Return the order with proper numeric conversions
    return {
      ...order,
      total_amount: parseFloat(order.total_amount),
      shipping_cost: parseFloat(order.shipping_cost)
    };
  } catch (error) {
    console.error('Checkout failed:', error);
    throw error;
  }
};