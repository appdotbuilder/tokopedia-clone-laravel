import { z } from 'zod';

// User roles enum
export const userRoleSchema = z.enum(['Admin', 'Customer']);
export type UserRole = z.infer<typeof userRoleSchema>;

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  password: z.string(),
  role: userRoleSchema,
  address: z.string().nullable(),
  phone: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// User input schemas
export const createUserInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: userRoleSchema.default('Customer'),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional()
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const updateUserInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: userRoleSchema.optional(),
  address: z.string().nullable().optional(),
  phone: z.string().nullable().optional()
});

export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export type LoginInput = z.infer<typeof loginInputSchema>;

// Category schema
export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Category = z.infer<typeof categorySchema>;

// Category input schemas
export const createCategoryInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateCategoryInput = z.infer<typeof createCategoryInputSchema>;

export const updateCategoryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional()
});

export type UpdateCategoryInput = z.infer<typeof updateCategoryInputSchema>;

// Product schema
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  code: z.string(),
  description: z.string().nullable(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  category_id: z.number(),
  image: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Product = z.infer<typeof productSchema>;

// Product input schemas
export const createProductInputSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().nullable().optional(),
  price: z.number().positive(),
  stock: z.number().int().nonnegative(),
  category_id: z.number(),
  image: z.string().nullable().optional()
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  price: z.number().positive().optional(),
  stock: z.number().int().nonnegative().optional(),
  category_id: z.number().optional(),
  image: z.string().nullable().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;

// Cart item schema
export const cartItemSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Cart input schemas
export const addToCartInputSchema = z.object({
  user_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive()
});

export type AddToCartInput = z.infer<typeof addToCartInputSchema>;

export const updateCartItemInputSchema = z.object({
  id: z.number(),
  quantity: z.number().int().positive()
});

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>;

// Order status enum
export const orderStatusSchema = z.enum(['pending', 'paid', 'shipped', 'completed', 'cancelled']);
export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Order schema
export const orderSchema = z.object({
  id: z.number(),
  user_id: z.number(),
  total_amount: z.number().positive(),
  status: orderStatusSchema,
  shipping_address: z.string(),
  shipping_method: z.string(),
  shipping_cost: z.number().nonnegative(),
  payment_method: z.string().nullable(),
  payment_status: z.string().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Order = z.infer<typeof orderSchema>;

// Order input schemas
export const createOrderInputSchema = z.object({
  user_id: z.number(),
  total_amount: z.number().positive(),
  shipping_address: z.string().min(1),
  shipping_method: z.string().min(1),
  shipping_cost: z.number().nonnegative(),
  payment_method: z.string().nullable().optional()
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const updateOrderInputSchema = z.object({
  id: z.number(),
  status: orderStatusSchema.optional(),
  payment_status: z.string().optional(),
  tracking_number: z.string().nullable().optional()
});

export type UpdateOrderInput = z.infer<typeof updateOrderInputSchema>;

// Order item schema
export const orderItemSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  created_at: z.coerce.date()
});

export type OrderItem = z.infer<typeof orderItemSchema>;

// Order item input schema
export const createOrderItemInputSchema = z.object({
  order_id: z.number(),
  product_id: z.number(),
  quantity: z.number().int().positive(),
  price: z.number().positive()
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemInputSchema>;

// Shipment status enum
export const shipmentStatusSchema = z.enum(['pending', 'in_transit', 'delivered', 'returned']);
export type ShipmentStatus = z.infer<typeof shipmentStatusSchema>;

// Shipment schema
export const shipmentSchema = z.object({
  id: z.number(),
  order_id: z.number(),
  courier: z.string(),
  tracking_number: z.string().nullable(),
  cost: z.number().positive(),
  status: shipmentStatusSchema,
  estimated_delivery: z.coerce.date().nullable(),
  delivered_at: z.coerce.date().nullable(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Shipment = z.infer<typeof shipmentSchema>;

// Shipment input schemas
export const createShipmentInputSchema = z.object({
  order_id: z.number(),
  courier: z.string().min(1),
  cost: z.number().positive(),
  estimated_delivery: z.coerce.date().nullable().optional()
});

export type CreateShipmentInput = z.infer<typeof createShipmentInputSchema>;

export const updateShipmentInputSchema = z.object({
  id: z.number(),
  tracking_number: z.string().nullable().optional(),
  status: shipmentStatusSchema.optional(),
  delivered_at: z.coerce.date().nullable().optional()
});

export type UpdateShipmentInput = z.infer<typeof updateShipmentInputSchema>;

// Checkout input schema
export const checkoutInputSchema = z.object({
  user_id: z.number(),
  shipping_address: z.string().min(1),
  shipping_method: z.string().min(1),
  payment_method: z.string().min(1)
});

export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

// Search and filter schemas
export const productFilterSchema = z.object({
  category_id: z.number().optional(),
  search: z.string().optional(),
  min_price: z.number().optional(),
  max_price: z.number().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export type ProductFilter = z.infer<typeof productFilterSchema>;

export const orderFilterSchema = z.object({
  status: orderStatusSchema.optional(),
  user_id: z.number().optional(),
  start_date: z.coerce.date().optional(),
  end_date: z.coerce.date().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export type OrderFilter = z.infer<typeof orderFilterSchema>;

// Export/report schemas
export const exportFormatSchema = z.enum(['pdf', 'csv']);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

export const exportRequestSchema = z.object({
  type: z.enum(['users', 'categories', 'products', 'orders', 'shipments']),
  format: exportFormatSchema,
  filters: z.record(z.any()).optional()
});

export type ExportRequest = z.infer<typeof exportRequestSchema>;