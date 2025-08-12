import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createUserInputSchema,
  loginInputSchema,
  updateUserInputSchema,
  createCategoryInputSchema,
  updateCategoryInputSchema,
  createProductInputSchema,
  updateProductInputSchema,
  productFilterSchema,
  addToCartInputSchema,
  updateCartItemInputSchema,
  checkoutInputSchema,
  orderFilterSchema,
  updateOrderInputSchema,
  createShipmentInputSchema,
  updateShipmentInputSchema,
  exportRequestSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { loginUser } from './handlers/login_user';
import { getUsers } from './handlers/get_users';
import { updateUser } from './handlers/update_user';
import { deleteUser } from './handlers/delete_user';

import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';

import { createProduct } from './handlers/create_product';
import { getProducts } from './handlers/get_products';
import { getProductById } from './handlers/get_product_by_id';
import { updateProduct } from './handlers/update_product';
import { deleteProduct } from './handlers/delete_product';

import { addToCart } from './handlers/add_to_cart';
import { getCart } from './handlers/get_cart';
import { updateCartItem } from './handlers/update_cart_item';
import { removeFromCart } from './handlers/remove_from_cart';

import { checkout } from './handlers/checkout';
import { getOrders } from './handlers/get_orders';
import { getOrderById } from './handlers/get_order_by_id';
import { updateOrder } from './handlers/update_order';

import { createShipment } from './handlers/create_shipment';
import { getShipments } from './handlers/get_shipments';
import { updateShipment } from './handlers/update_shipment';
import { trackShipment } from './handlers/track_shipment';
import { calculateShipping } from './handlers/calculate_shipping';

import { processPayment } from './handlers/process_payment';
import { exportData } from './handlers/export_data';
import { getDashboardStats } from './handlers/get_dashboard_stats';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management routes
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  loginUser: publicProcedure
    .input(loginInputSchema)
    .mutation(({ input }) => loginUser(input)),

  getUsers: publicProcedure
    .query(() => getUsers()),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  deleteUser: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteUser(input.id)),

  // Category management routes
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),

  getCategories: publicProcedure
    .query(() => getCategories()),

  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),

  deleteCategory: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteCategory(input.id)),

  // Product management routes
  createProduct: publicProcedure
    .input(createProductInputSchema)
    .mutation(({ input }) => createProduct(input)),

  getProducts: publicProcedure
    .input(productFilterSchema.optional())
    .query(({ input }) => getProducts(input)),

  getProductById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getProductById(input.id)),

  updateProduct: publicProcedure
    .input(updateProductInputSchema)
    .mutation(({ input }) => updateProduct(input)),

  deleteProduct: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ input }) => deleteProduct(input.id)),

  // Shopping cart routes
  addToCart: publicProcedure
    .input(addToCartInputSchema)
    .mutation(({ input }) => addToCart(input)),

  getCart: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getCart(input.userId)),

  updateCartItem: publicProcedure
    .input(updateCartItemInputSchema)
    .mutation(({ input }) => updateCartItem(input)),

  removeFromCart: publicProcedure
    .input(z.object({ cartItemId: z.number() }))
    .mutation(({ input }) => removeFromCart(input.cartItemId)),

  // Checkout and payment routes
  checkout: publicProcedure
    .input(checkoutInputSchema)
    .mutation(({ input }) => checkout(input)),

  calculateShipping: publicProcedure
    .input(z.object({ destination: z.string(), weight: z.number() }))
    .query(({ input }) => calculateShipping(input.destination, input.weight)),

  processPayment: publicProcedure
    .input(z.object({ orderId: z.number(), paymentMethod: z.string(), amount: z.number() }))
    .mutation(({ input }) => processPayment(input.orderId, input.paymentMethod, input.amount)),

  // Order management routes
  getOrders: publicProcedure
    .input(z.object({ filter: orderFilterSchema.optional(), userId: z.number().optional() }))
    .query(({ input }) => getOrders(input.filter, input.userId)),

  getOrderById: publicProcedure
    .input(z.object({ id: z.number(), userId: z.number().optional() }))
    .query(({ input }) => getOrderById(input.id, input.userId)),

  updateOrder: publicProcedure
    .input(updateOrderInputSchema)
    .mutation(({ input }) => updateOrder(input)),

  // Shipment management routes
  createShipment: publicProcedure
    .input(createShipmentInputSchema)
    .mutation(({ input }) => createShipment(input)),

  getShipments: publicProcedure
    .query(() => getShipments()),

  updateShipment: publicProcedure
    .input(updateShipmentInputSchema)
    .mutation(({ input }) => updateShipment(input)),

  trackShipment: publicProcedure
    .input(z.object({ orderId: z.number() }))
    .query(({ input }) => trackShipment(input.orderId)),

  // Admin dashboard routes
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),

  exportData: publicProcedure
    .input(exportRequestSchema)
    .mutation(({ input }) => exportData(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();