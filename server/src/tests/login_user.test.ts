import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { loginUser } from '../handlers/login_user';
import { eq } from 'drizzle-orm';

describe('loginUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully login with valid credentials', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer',
        address: '123 Test St',
        phone: '123-456-7890'
      })
      .execute();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'password123'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toBe('test@example.com');
    expect(result!.name).toBe('Test User');
    expect(result!.role).toBe('Customer');
    expect(result!.address).toBe('123 Test St');
    expect(result!.phone).toBe('123-456-7890');
    expect(result!.id).toBeDefined();
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
    
    // Ensure password is not returned
    expect((result as any).password).toBeUndefined();
  });

  it('should return null for non-existent user', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'password123'
    };

    const result = await loginUser(loginInput);
    expect(result).toBeNull();
  });

  it('should return null for incorrect password', async () => {
    // Create a test user first
    await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer',
        address: '123 Test St',
        phone: '123-456-7890'
      })
      .execute();

    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'wrongpassword'
    };

    const result = await loginUser(loginInput);
    expect(result).toBeNull();
  });

  it('should login admin user successfully', async () => {
    // Create an admin user
    await db.insert(usersTable)
      .values({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'Admin',
        address: null,
        phone: null
      })
      .execute();

    const loginInput: LoginInput = {
      email: 'admin@example.com',
      password: 'admin123'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.email).toBe('admin@example.com');
    expect(result!.name).toBe('Admin User');
    expect(result!.role).toBe('Admin');
    expect(result!.address).toBeNull();
    expect(result!.phone).toBeNull();
    
    // Ensure password is not returned
    expect((result as any).password).toBeUndefined();
  });

  it('should handle case-sensitive email matching', async () => {
    // Create a test user
    await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer',
        address: '123 Test St',
        phone: '123-456-7890'
      })
      .execute();

    // Try to login with different case
    const loginInput: LoginInput = {
      email: 'TEST@EXAMPLE.COM',
      password: 'password123'
    };

    const result = await loginUser(loginInput);
    expect(result).toBeNull(); // Should fail due to case sensitivity
  });

  it('should verify user data is stored correctly in database', async () => {
    // Create a test user
    const insertResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'Customer',
        address: '123 Test St',
        phone: '123-456-7890'
      })
      .returning()
      .execute();

    const createdUser = insertResult[0];

    // Login and verify the returned data matches database
    const loginInput: LoginInput = {
      email: 'test@example.com',
      password: 'password123'
    };

    const result = await loginUser(loginInput);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdUser.id);
    expect(result!.email).toBe(createdUser.email);
    expect(result!.name).toBe(createdUser.name);
    expect(result!.role).toBe(createdUser.role);
    expect(result!.created_at).toEqual(createdUser.created_at);
    expect(result!.updated_at).toEqual(createdUser.updated_at);
  });
});