import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { 
  usersTable, 
  categoriesTable, 
  productsTable, 
  ordersTable, 
  shipmentsTable 
} from '../db/schema';
import { type ExportRequest } from '../schema';
import { exportData } from '../handlers/export_data';

// Test data
const testUser = {
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  role: 'Customer' as const,
  address: '123 Main St',
  phone: '555-0123'
};

const testCategory = {
  name: 'Electronics',
  description: 'Electronic devices and accessories'
};

const testProduct = {
  name: 'Test Product',
  code: 'TEST001',
  description: 'A product for testing',
  price: '99.99',
  stock: 50,
  category_id: 1
};

const testOrder = {
  user_id: 1,
  total_amount: '149.99',
  status: 'paid' as const,
  shipping_address: '123 Main St, City, State',
  shipping_method: 'Standard',
  shipping_cost: '9.99',
  payment_method: 'Credit Card'
};

const testShipment = {
  order_id: 1,
  courier: 'UPS',
  tracking_number: '1234567890',
  cost: '9.99',
  status: 'in_transit' as const
};

describe('exportData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('CSV exports', () => {
    it('should export users to CSV format', async () => {
      // Create test user
      await db.insert(usersTable).values(testUser).execute();

      const request: ExportRequest = {
        type: 'users',
        format: 'csv'
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^users-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/users-export-.+\.csv$/);
      expect(typeof result.filename).toBe('string');
      expect(typeof result.url).toBe('string');
    });

    it('should export categories to CSV format', async () => {
      // Create test category
      await db.insert(categoriesTable).values(testCategory).execute();

      const request: ExportRequest = {
        type: 'categories',
        format: 'csv'
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^categories-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/categories-export-.+\.csv$/);
    });

    it('should export products to CSV format', async () => {
      // Create prerequisite data
      await db.insert(categoriesTable).values(testCategory).execute();
      await db.insert(productsTable).values(testProduct).execute();

      const request: ExportRequest = {
        type: 'products',
        format: 'csv'
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^products-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/products-export-.+\.csv$/);
    });

    it('should export orders to CSV format', async () => {
      // Create prerequisite data
      await db.insert(usersTable).values(testUser).execute();
      await db.insert(ordersTable).values(testOrder).execute();

      const request: ExportRequest = {
        type: 'orders',
        format: 'csv'
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^orders-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/orders-export-.+\.csv$/);
    });

    it('should export shipments to CSV format', async () => {
      // Create prerequisite data
      await db.insert(usersTable).values(testUser).execute();
      await db.insert(ordersTable).values(testOrder).execute();
      await db.insert(shipmentsTable).values(testShipment).execute();

      const request: ExportRequest = {
        type: 'shipments',
        format: 'csv'
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^shipments-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/shipments-export-.+\.csv$/);
    });
  });

  describe('PDF exports', () => {
    it('should export users to PDF format', async () => {
      // Create test user
      await db.insert(usersTable).values(testUser).execute();

      const request: ExportRequest = {
        type: 'users',
        format: 'pdf'
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^users-export-.+\.pdf$/);
      expect(result.url).toMatch(/^\/exports\/users-export-.+\.pdf$/);
    });

    it('should export products to PDF format', async () => {
      // Create prerequisite data
      await db.insert(categoriesTable).values(testCategory).execute();
      await db.insert(productsTable).values(testProduct).execute();

      const request: ExportRequest = {
        type: 'products',
        format: 'pdf'
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^products-export-.+\.pdf$/);
      expect(result.url).toMatch(/^\/exports\/products-export-.+\.pdf$/);
    });
  });

  describe('filtered exports', () => {
    beforeEach(async () => {
      // Create test data with different attributes for filtering
      await db.insert(usersTable).values([
        { ...testUser, role: 'Admin' as const },
        { ...testUser, email: 'admin@example.com', name: 'Admin User', role: 'Customer' as const }
      ]).execute();

      await db.insert(categoriesTable).values([
        testCategory,
        { name: 'Books', description: 'Books and literature' }
      ]).execute();

      await db.insert(productsTable).values([
        testProduct,
        {
          name: 'Expensive Product',
          code: 'EXP001',
          description: 'An expensive product',
          price: '999.99',
          stock: 10,
          category_id: 1
        }
      ]).execute();

      await db.insert(ordersTable).values([
        testOrder,
        {
          user_id: 1,
          total_amount: '99.99',
          status: 'pending' as const,
          shipping_address: '456 Oak Ave',
          shipping_method: 'Express',
          shipping_cost: '19.99'
        }
      ]).execute();
    });

    it('should export users with role filter', async () => {
      const request: ExportRequest = {
        type: 'users',
        format: 'csv',
        filters: { role: 'Admin' }
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^users-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/users-export-.+\.csv$/);
    });

    it('should export products with price range filter', async () => {
      const request: ExportRequest = {
        type: 'products',
        format: 'csv',
        filters: { 
          min_price: 100,
          max_price: 1000
        }
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^products-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/products-export-.+\.csv$/);
    });

    it('should export orders with status filter', async () => {
      const request: ExportRequest = {
        type: 'orders',
        format: 'pdf',
        filters: { status: 'paid' }
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^orders-export-.+\.pdf$/);
      expect(result.url).toMatch(/^\/exports\/orders-export-.+\.pdf$/);
    });

    it('should export categories with search filter', async () => {
      const request: ExportRequest = {
        type: 'categories',
        format: 'csv',
        filters: { search: 'Electronic' }
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^categories-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/categories-export-.+\.csv$/);
    });

    it('should export with date range filter', async () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const request: ExportRequest = {
        type: 'users',
        format: 'csv',
        filters: {
          start_date: yesterday.toISOString(),
          end_date: tomorrow.toISOString()
        }
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^users-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/users-export-.+\.csv$/);
    });
  });

  describe('error handling', () => {
    it('should throw error for unsupported export type', async () => {
      const request = {
        type: 'invalid_type' as any,
        format: 'csv' as const
      };

      expect(exportData(request)).rejects.toThrow(/unsupported export type/i);
    });

    it('should handle empty data gracefully', async () => {
      const request: ExportRequest = {
        type: 'users',
        format: 'csv'
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^users-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/users-export-.+\.csv$/);
    });

    it('should handle invalid filter values gracefully', async () => {
      // This test ensures invalid filters are safely ignored
      const request: ExportRequest = {
        type: 'products',
        format: 'csv',
        filters: { 
          category_id: 'invalid_id', // This will be ignored due to NaN check
          min_price: 'invalid_price', // This will be ignored due to NaN check
          search: 'valid_search_term' // This will work normally
        }
      };

      const result = await exportData(request);

      expect(result.filename).toMatch(/^products-export-.+\.csv$/);
      expect(result.url).toMatch(/^\/exports\/products-export-.+\.csv$/);
    });
  });

  describe('filename and URL generation', () => {
    it('should generate unique filenames for concurrent exports', async () => {
      await db.insert(usersTable).values(testUser).execute();

      const request: ExportRequest = {
        type: 'users',
        format: 'csv'
      };

      // Run multiple exports with slight delay to ensure uniqueness
      const results: Array<{ url: string; filename: string }> = [];
      
      for (let i = 0; i < 3; i++) {
        const result = await exportData(request);
        results.push(result);
        // Small delay to ensure timestamp differences
        await new Promise(resolve => setTimeout(resolve, 2));
      }

      // All filenames should be unique
      const filenames = results.map(r => r.filename);
      const uniqueFilenames = new Set(filenames);
      expect(uniqueFilenames.size).toBe(filenames.length);

      // All URLs should be unique
      const urls = results.map(r => r.url);
      const uniqueUrls = new Set(urls);
      expect(uniqueUrls.size).toBe(urls.length);
      
      // Verify filename format
      filenames.forEach(filename => {
        expect(filename).toMatch(/^users-export-.+\.csv$/);
      });
    });

    it('should generate correct filename format for all types and formats', async () => {
      const types = ['users', 'categories', 'products', 'orders', 'shipments'] as const;
      const formats = ['csv', 'pdf'] as const;

      // Create minimal test data
      await db.insert(usersTable).values(testUser).execute();
      await db.insert(categoriesTable).values(testCategory).execute();
      await db.insert(productsTable).values(testProduct).execute();
      await db.insert(ordersTable).values(testOrder).execute();
      await db.insert(shipmentsTable).values(testShipment).execute();

      for (const type of types) {
        for (const format of formats) {
          const request: ExportRequest = { type, format };
          const result = await exportData(request);

          expect(result.filename).toMatch(new RegExp(`^${type}-export-.+\\.${format}$`));
          expect(result.url).toMatch(new RegExp(`^\\/exports\\/${type}-export-.+\\.${format}$`));
        }
      }
    });
  });
});