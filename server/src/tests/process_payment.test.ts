import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { ordersTable, usersTable, categoriesTable, productsTable } from '../db/schema';
import { processPayment } from '../handlers/process_payment';
import { eq } from 'drizzle-orm';

describe('processPayment', () => {
    beforeEach(createDB);
    afterEach(resetDB);

    let testUserId: number;
    let testCategoryId: number;
    let testProductId: number;
    let testOrderId: number;

    beforeEach(async () => {
        // Create test user
        const userResult = await db.insert(usersTable)
            .values({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'Customer'
            })
            .returning()
            .execute();
        testUserId = userResult[0].id;

        // Create test category
        const categoryResult = await db.insert(categoriesTable)
            .values({
                name: 'Test Category',
                description: 'Test category description'
            })
            .returning()
            .execute();
        testCategoryId = categoryResult[0].id;

        // Create test product
        const productResult = await db.insert(productsTable)
            .values({
                name: 'Test Product',
                code: 'TEST001',
                description: 'Test product description',
                price: '99.99',
                stock: 10,
                category_id: testCategoryId
            })
            .returning()
            .execute();
        testProductId = productResult[0].id;

        // Create test order
        const orderResult = await db.insert(ordersTable)
            .values({
                user_id: testUserId,
                total_amount: '99.99',
                status: 'pending',
                shipping_address: '123 Test St',
                shipping_method: 'standard',
                shipping_cost: '5.00'
            })
            .returning()
            .execute();
        testOrderId = orderResult[0].id;
    });

    it('should process credit card payment successfully', async () => {
        const result = await processPayment(testOrderId, 'credit_card', 99.99);

        expect(result.success).toBe(true);
        expect(result.transaction_id).toBeDefined();
        expect(result.transaction_id).toMatch(/^TXN\d+[A-Z0-9]{5}$/);
        expect(result.payment_url).toBeDefined();
        expect(result.payment_url).toMatch(/^https:\/\/payment-gateway\.com\/pay\/TXN/);
        expect(result.error_message).toBeUndefined();

        // Verify order was updated
        const orders = await db.select()
            .from(ordersTable)
            .where(eq(ordersTable.id, testOrderId))
            .execute();

        expect(orders).toHaveLength(1);
        expect(orders[0].payment_method).toBe('credit_card');
        expect(orders[0].payment_status).toBe('paid');
        expect(orders[0].status).toBe('paid');
    });

    it('should process bank transfer payment with pending status', async () => {
        const result = await processPayment(testOrderId, 'bank_transfer', 99.99);

        expect(result.success).toBe(true);
        expect(result.transaction_id).toBeDefined();
        expect(result.payment_url).toBeDefined();

        // Verify order was updated with pending status for bank transfer
        const orders = await db.select()
            .from(ordersTable)
            .where(eq(ordersTable.id, testOrderId))
            .execute();

        expect(orders).toHaveLength(1);
        expect(orders[0].payment_method).toBe('bank_transfer');
        expect(orders[0].payment_status).toBe('pending');
        expect(orders[0].status).toBe('pending');
    });

    it('should process e-wallet payment successfully', async () => {
        const result = await processPayment(testOrderId, 'e_wallet', 99.99);

        expect(result.success).toBe(true);
        expect(result.transaction_id).toBeDefined();
        expect(result.payment_url).toBeDefined();

        // Verify order was updated
        const orders = await db.select()
            .from(ordersTable)
            .where(eq(ordersTable.id, testOrderId))
            .execute();

        expect(orders).toHaveLength(1);
        expect(orders[0].payment_method).toBe('e_wallet');
        expect(orders[0].payment_status).toBe('paid');
        expect(orders[0].status).toBe('paid');
    });

    it('should fail when order does not exist', async () => {
        const result = await processPayment(99999, 'credit_card', 99.99);

        expect(result.success).toBe(false);
        expect(result.error_message).toBe('Order not found');
        expect(result.transaction_id).toBeUndefined();
        expect(result.payment_url).toBeUndefined();
    });

    it('should fail when payment amount does not match order total', async () => {
        const result = await processPayment(testOrderId, 'credit_card', 150.00);

        expect(result.success).toBe(false);
        expect(result.error_message).toBe('Payment amount does not match order total');
        expect(result.transaction_id).toBeUndefined();
        expect(result.payment_url).toBeUndefined();
    });

    it('should fail with invalid payment method', async () => {
        const result = await processPayment(testOrderId, 'invalid_method', 99.99);

        expect(result.success).toBe(false);
        expect(result.error_message).toBe('Invalid payment method');
        expect(result.transaction_id).toBeUndefined();
        expect(result.payment_url).toBeUndefined();
    });

    it('should fail when order is already paid', async () => {
        // First, mark order as paid
        await db.update(ordersTable)
            .set({
                payment_status: 'paid',
                status: 'paid'
            })
            .where(eq(ordersTable.id, testOrderId))
            .execute();

        const result = await processPayment(testOrderId, 'credit_card', 99.99);

        expect(result.success).toBe(false);
        expect(result.error_message).toBe('Order is already paid');
        expect(result.transaction_id).toBeUndefined();
        expect(result.payment_url).toBeUndefined();
    });

    it('should handle small amount differences in order total', async () => {
        // Test with very small difference (within 0.01 tolerance)
        const result = await processPayment(testOrderId, 'credit_card', 99.985);

        expect(result.success).toBe(true);
        expect(result.transaction_id).toBeDefined();
    });

    it('should reject amounts with differences larger than tolerance', async () => {
        // Test with difference larger than 0.01 tolerance (0.02 difference)
        const result = await processPayment(testOrderId, 'credit_card', 99.97);

        expect(result.success).toBe(false);
        expect(result.error_message).toBe('Payment amount does not match order total');
    });

    it('should generate unique transaction IDs', async () => {
        const result1 = await processPayment(testOrderId, 'credit_card', 99.99);
        
        // Create another order for second payment
        const orderResult2 = await db.insert(ordersTable)
            .values({
                user_id: testUserId,
                total_amount: '149.99',
                status: 'pending',
                shipping_address: '456 Test Ave',
                shipping_method: 'express',
                shipping_cost: '10.00'
            })
            .returning()
            .execute();
        
        const result2 = await processPayment(orderResult2[0].id, 'e_wallet', 149.99);

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result1.transaction_id).not.toBe(result2.transaction_id);
    });

    it('should update order updated_at timestamp', async () => {
        const beforePayment = new Date();
        
        await processPayment(testOrderId, 'credit_card', 99.99);

        const orders = await db.select()
            .from(ordersTable)
            .where(eq(ordersTable.id, testOrderId))
            .execute();

        expect(orders[0].updated_at.getTime()).toBeGreaterThanOrEqual(beforePayment.getTime());
    });

    it('should handle decimal precision correctly', async () => {
        // Create order with precise decimal amount
        const orderResult = await db.insert(ordersTable)
            .values({
                user_id: testUserId,
                total_amount: '123.45',
                status: 'pending',
                shipping_address: '789 Precision St',
                shipping_method: 'standard',
                shipping_cost: '7.50'
            })
            .returning()
            .execute();

        const result = await processPayment(orderResult[0].id, 'credit_card', 123.45);

        // Debug output if test fails
        if (!result.success) {
            console.log('Payment failed with error:', result.error_message);
            console.log('Order amount from DB:', orderResult[0].total_amount);
            console.log('Payment amount:', 123.45);
        }

        expect(result.success).toBe(true);
        expect(result.transaction_id).toBeDefined();
    });

    it('should handle payment method validation case sensitively', async () => {
        const result = await processPayment(testOrderId, 'Credit_Card', 99.99);

        expect(result.success).toBe(false);
        expect(result.error_message).toBe('Invalid payment method');
    });
});