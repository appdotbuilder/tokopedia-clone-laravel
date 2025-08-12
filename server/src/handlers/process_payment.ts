import { db } from '../db';
import { ordersTable } from '../db/schema';
import { eq } from 'drizzle-orm';

interface PaymentResult {
    success: boolean;
    transaction_id?: string;
    payment_url?: string;
    error_message?: string;
}

export async function processPayment(orderId: number, paymentMethod: string, amount: number): Promise<PaymentResult> {
    try {
        // Validate order exists and get current status
        const orders = await db.select()
            .from(ordersTable)
            .where(eq(ordersTable.id, orderId))
            .execute();

        if (orders.length === 0) {
            return {
                success: false,
                error_message: 'Order not found'
            };
        }

        const order = orders[0];

        // Check if order is already paid
        if (order.payment_status === 'paid') {
            return {
                success: false,
                error_message: 'Order is already paid'
            };
        }

        // Check if order amount matches payment amount (tolerance of 0.009 to handle floating point precision)
        const orderAmount = parseFloat(order.total_amount);
        const amountDifference = Math.abs(orderAmount - amount);
        if (amountDifference > 0.009) {
            return {
                success: false,
                error_message: 'Payment amount does not match order total'
            };
        }

        // Validate payment method
        const validPaymentMethods = ['credit_card', 'bank_transfer', 'e_wallet'];
        if (!validPaymentMethods.includes(paymentMethod)) {
            return {
                success: false,
                error_message: 'Invalid payment method'
            };
        }

        // Generate transaction ID and simulate payment gateway integration
        const transactionId = `TXN${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
        const paymentUrl = `https://payment-gateway.com/pay/${transactionId}`;

        // Simulate different payment gateway responses based on payment method
        let paymentSuccess = true;
        let errorMessage: string | undefined;

        // Note: Random payment failures disabled for testing reliability
        // In production, you might want to simulate occasional gateway failures
        // const shouldFail = Math.random() < 0.05;
        const shouldFail = false;
        if (shouldFail) {
            paymentSuccess = false;
            errorMessage = 'Payment gateway temporarily unavailable';
        } else {
            // Different payment methods have different behaviors
            switch (paymentMethod) {
                case 'credit_card':
                    // Credit card payments are processed immediately
                    paymentSuccess = true;
                    break;
                case 'bank_transfer':
                    // Bank transfers require manual confirmation
                    paymentSuccess = true;
                    break;
                case 'e_wallet':
                    // E-wallet payments are processed immediately
                    paymentSuccess = true;
                    break;
            }
        }

        if (paymentSuccess) {
            // Update order with payment information
            await db.update(ordersTable)
                .set({
                    payment_method: paymentMethod,
                    payment_status: paymentMethod === 'bank_transfer' ? 'pending' : 'paid',
                    status: paymentMethod === 'bank_transfer' ? 'pending' : 'paid',
                    updated_at: new Date()
                })
                .where(eq(ordersTable.id, orderId))
                .execute();

            return {
                success: true,
                transaction_id: transactionId,
                payment_url: paymentUrl
            };
        } else {
            // Update order with failed payment status
            await db.update(ordersTable)
                .set({
                    payment_method: paymentMethod,
                    payment_status: 'failed',
                    updated_at: new Date()
                })
                .where(eq(ordersTable.id, orderId))
                .execute();

            return {
                success: false,
                error_message: errorMessage || 'Payment processing failed'
            };
        }
    } catch (error) {
        console.error('Payment processing failed:', error);
        
        // Try to update order status to failed if possible
        try {
            await db.update(ordersTable)
                .set({
                    payment_status: 'failed',
                    updated_at: new Date()
                })
                .where(eq(ordersTable.id, orderId))
                .execute();
        } catch (updateError) {
            console.error('Failed to update order status after payment error:', updateError);
        }

        return {
            success: false,
            error_message: 'Internal payment processing error'
        };
    }
}