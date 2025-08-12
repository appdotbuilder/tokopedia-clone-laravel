import { db } from '../db';
import { 
  usersTable, 
  categoriesTable, 
  productsTable, 
  ordersTable, 
  shipmentsTable 
} from '../db/schema';
import { type ExportRequest } from '../schema';
import { eq, gte, lte, and, ilike, desc, SQL } from 'drizzle-orm';

// Simulated export functionality - in a real app, you'd use libraries like:
// - PDF: jsPDF, PDFKit, or Puppeteer
// - CSV: csv-writer or fast-csv
export async function exportData(request: ExportRequest): Promise<{ url: string; filename: string }> {
  try {
    // Add microsecond precision for uniqueness
    const timestamp = Date.now() + Math.random().toString(36).substring(2, 9);
    const filename = `${request.type}-export-${timestamp}.${request.format}`;
    
    // Get data based on type
    let data: any[] = [];
    let headers: string[] = [];
    
    switch (request.type) {
      case 'users':
        ({ data, headers } = await exportUsers(request.filters || {}));
        break;
      case 'categories':
        ({ data, headers } = await exportCategories(request.filters || {}));
        break;
      case 'products':
        ({ data, headers } = await exportProducts(request.filters || {}));
        break;
      case 'orders':
        ({ data, headers } = await exportOrders(request.filters || {}));
        break;
      case 'shipments':
        ({ data, headers } = await exportShipments(request.filters || {}));
        break;
      default:
        throw new Error(`Unsupported export type: ${request.type}`);
    }
    
    // Generate export content based on format
    let exportContent: string;
    if (request.format === 'csv') {
      exportContent = generateCSV(data, headers);
    } else {
      exportContent = generatePDF(data, headers, request.type);
    }
    
    // In a real implementation, you would save the file to disk or cloud storage
    // and return the actual URL. For now, we simulate the response.
    const url = `/exports/${filename}`;
    
    // Simulate file generation delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return {
      url,
      filename
    };
  } catch (error) {
    console.error('Export data failed:', error);
    throw error;
  }
}

async function exportUsers(filters: Record<string, any>): Promise<{ data: any[]; headers: string[] }> {
  const conditions: SQL<unknown>[] = [];
  
  if (filters['role']) {
    conditions.push(eq(usersTable.role, filters['role']));
  }
  
  if (filters['search']) {
    conditions.push(ilike(usersTable.name, `%${filters['search']}%`));
  }
  
  if (filters['start_date']) {
    conditions.push(gte(usersTable.created_at, new Date(filters['start_date'])));
  }
  
  if (filters['end_date']) {
    conditions.push(lte(usersTable.created_at, new Date(filters['end_date'])));
  }
  
  // Build query conditionally
  const results = conditions.length > 0 
    ? await db.select().from(usersTable).where(and(...conditions)).orderBy(desc(usersTable.created_at)).execute()
    : await db.select().from(usersTable).orderBy(desc(usersTable.created_at)).execute();
  
  const headers = ['ID', 'Name', 'Email', 'Role', 'Phone', 'Address', 'Created Date'];
  
  const data = results.map(user => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || 'N/A',
    address: user.address || 'N/A',
    created_at: user.created_at.toISOString().split('T')[0]
  }));
  
  return { data, headers };
}

async function exportCategories(filters: Record<string, any>): Promise<{ data: any[]; headers: string[] }> {
  const conditions: SQL<unknown>[] = [];
  
  if (filters['search']) {
    conditions.push(ilike(categoriesTable.name, `%${filters['search']}%`));
  }
  
  if (filters['start_date']) {
    conditions.push(gte(categoriesTable.created_at, new Date(filters['start_date'])));
  }
  
  if (filters['end_date']) {
    conditions.push(lte(categoriesTable.created_at, new Date(filters['end_date'])));
  }
  
  // Build query conditionally
  const results = conditions.length > 0 
    ? await db.select().from(categoriesTable).where(and(...conditions)).orderBy(desc(categoriesTable.created_at)).execute()
    : await db.select().from(categoriesTable).orderBy(desc(categoriesTable.created_at)).execute();
  
  const headers = ['ID', 'Name', 'Description', 'Created Date', 'Updated Date'];
  
  const data = results.map(category => ({
    id: category.id,
    name: category.name,
    description: category.description || 'N/A',
    created_at: category.created_at.toISOString().split('T')[0],
    updated_at: category.updated_at.toISOString().split('T')[0]
  }));
  
  return { data, headers };
}

async function exportProducts(filters: Record<string, any>): Promise<{ data: any[]; headers: string[] }> {
  const conditions: SQL<unknown>[] = [];
  
  if (filters['category_id'] && !isNaN(parseInt(filters['category_id']))) {
    conditions.push(eq(productsTable.category_id, parseInt(filters['category_id'])));
  }
  
  if (filters['search']) {
    conditions.push(ilike(productsTable.name, `%${filters['search']}%`));
  }
  
  if (filters['min_price'] && !isNaN(parseFloat(filters['min_price']))) {
    conditions.push(gte(productsTable.price, filters['min_price'].toString()));
  }
  
  if (filters['max_price'] && !isNaN(parseFloat(filters['max_price']))) {
    conditions.push(lte(productsTable.price, filters['max_price'].toString()));
  }
  
  if (filters['start_date']) {
    conditions.push(gte(productsTable.created_at, new Date(filters['start_date'])));
  }
  
  if (filters['end_date']) {
    conditions.push(lte(productsTable.created_at, new Date(filters['end_date'])));
  }
  
  // Build query conditionally
  const results = conditions.length > 0 
    ? await db.select().from(productsTable).where(and(...conditions)).orderBy(desc(productsTable.created_at)).execute()
    : await db.select().from(productsTable).orderBy(desc(productsTable.created_at)).execute();
  
  const headers = ['ID', 'Name', 'Code', 'Description', 'Price', 'Stock', 'Category ID', 'Created Date'];
  
  const data = results.map(product => ({
    id: product.id,
    name: product.name,
    code: product.code,
    description: product.description || 'N/A',
    price: parseFloat(product.price),
    stock: product.stock,
    category_id: product.category_id,
    created_at: product.created_at.toISOString().split('T')[0]
  }));
  
  return { data, headers };
}

async function exportOrders(filters: Record<string, any>): Promise<{ data: any[]; headers: string[] }> {
  const conditions: SQL<unknown>[] = [];
  
  if (filters['status']) {
    conditions.push(eq(ordersTable.status, filters['status']));
  }
  
  if (filters['user_id'] && !isNaN(parseInt(filters['user_id']))) {
    conditions.push(eq(ordersTable.user_id, parseInt(filters['user_id'])));
  }
  
  if (filters['start_date']) {
    conditions.push(gte(ordersTable.created_at, new Date(filters['start_date'])));
  }
  
  if (filters['end_date']) {
    conditions.push(lte(ordersTable.created_at, new Date(filters['end_date'])));
  }
  
  if (filters['min_amount'] && !isNaN(parseFloat(filters['min_amount']))) {
    conditions.push(gte(ordersTable.total_amount, filters['min_amount'].toString()));
  }
  
  if (filters['max_amount'] && !isNaN(parseFloat(filters['max_amount']))) {
    conditions.push(lte(ordersTable.total_amount, filters['max_amount'].toString()));
  }
  
  // Build query conditionally
  const results = conditions.length > 0 
    ? await db.select().from(ordersTable).where(and(...conditions)).orderBy(desc(ordersTable.created_at)).execute()
    : await db.select().from(ordersTable).orderBy(desc(ordersTable.created_at)).execute();
  
  const headers = ['ID', 'User ID', 'Total Amount', 'Status', 'Shipping Method', 'Shipping Cost', 'Payment Method', 'Created Date'];
  
  const data = results.map(order => ({
    id: order.id,
    user_id: order.user_id,
    total_amount: parseFloat(order.total_amount),
    status: order.status,
    shipping_method: order.shipping_method,
    shipping_cost: parseFloat(order.shipping_cost),
    payment_method: order.payment_method || 'N/A',
    created_at: order.created_at.toISOString().split('T')[0]
  }));
  
  return { data, headers };
}

async function exportShipments(filters: Record<string, any>): Promise<{ data: any[]; headers: string[] }> {
  const conditions: SQL<unknown>[] = [];
  
  if (filters['status']) {
    conditions.push(eq(shipmentsTable.status, filters['status']));
  }
  
  if (filters['courier']) {
    conditions.push(ilike(shipmentsTable.courier, `%${filters['courier']}%`));
  }
  
  if (filters['order_id'] && !isNaN(parseInt(filters['order_id']))) {
    conditions.push(eq(shipmentsTable.order_id, parseInt(filters['order_id'])));
  }
  
  if (filters['start_date']) {
    conditions.push(gte(shipmentsTable.created_at, new Date(filters['start_date'])));
  }
  
  if (filters['end_date']) {
    conditions.push(lte(shipmentsTable.created_at, new Date(filters['end_date'])));
  }
  
  // Build query conditionally
  const results = conditions.length > 0 
    ? await db.select().from(shipmentsTable).where(and(...conditions)).orderBy(desc(shipmentsTable.created_at)).execute()
    : await db.select().from(shipmentsTable).orderBy(desc(shipmentsTable.created_at)).execute();
  
  const headers = ['ID', 'Order ID', 'Courier', 'Tracking Number', 'Cost', 'Status', 'Estimated Delivery', 'Delivered At', 'Created Date'];
  
  const data = results.map(shipment => ({
    id: shipment.id,
    order_id: shipment.order_id,
    courier: shipment.courier,
    tracking_number: shipment.tracking_number || 'N/A',
    cost: parseFloat(shipment.cost),
    status: shipment.status,
    estimated_delivery: shipment.estimated_delivery ? shipment.estimated_delivery.toISOString().split('T')[0] : 'N/A',
    delivered_at: shipment.delivered_at ? shipment.delivered_at.toISOString().split('T')[0] : 'N/A',
    created_at: shipment.created_at.toISOString().split('T')[0]
  }));
  
  return { data, headers };
}

function generateCSV(data: any[], headers: string[]): string {
  if (data.length === 0) {
    return headers.join(',') + '\n';
  }
  
  const csvRows = [headers.join(',')];
  
  for (const row of data) {
    const values = headers.map(header => {
      // Convert header to key format (handle spaces and special cases)
      let key = header.toLowerCase().replace(/\s+/g, '_');
      if (key === 'created_date') key = 'created_at';
      if (key === 'updated_date') key = 'updated_at';
      
      let value = row[key] || '';
      
      // Handle special cases for CSV formatting
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    csvRows.push(values.join(','));
  }
  
  return csvRows.join('\n');
}

function generatePDF(data: any[], headers: string[], type: string): string {
  // This is a simulated PDF generation
  // In a real implementation, you would use a PDF library
  const title = `${type.toUpperCase()} EXPORT REPORT`;
  const date = new Date().toISOString().split('T')[0];
  
  let pdfContent = `PDF Document: ${title}\n`;
  pdfContent += `Generated on: ${date}\n`;
  pdfContent += `Total records: ${data.length}\n\n`;
  
  // Add headers
  pdfContent += headers.join(' | ') + '\n';
  pdfContent += '-'.repeat(headers.join(' | ').length) + '\n';
  
  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      // Convert header to key format (handle spaces and special cases)
      let key = header.toLowerCase().replace(/\s+/g, '_');
      if (key === 'created_date') key = 'created_at';
      if (key === 'updated_date') key = 'updated_at';
      
      return String(row[key] || '');
    });
    pdfContent += values.join(' | ') + '\n';
  }
  
  return pdfContent;
}