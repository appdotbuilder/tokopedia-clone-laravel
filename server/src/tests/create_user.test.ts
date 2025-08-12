import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  password: 'password123',
  role: 'Customer',
  address: '123 Main St',
  phone: '+1234567890'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with all fields', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.name).toEqual('John Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.role).toEqual('Customer');
    expect(result.address).toEqual('123 Main St');
    expect(result.phone).toEqual('+1234567890');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed, not plain text
    expect(result.password).not.toEqual('password123');
    expect(result.password.length).toBeGreaterThan(20); // Hashed passwords are longer
  });

  it('should create a user with minimal required fields', async () => {
    const minimalInput: CreateUserInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      password: 'securepass',
      role: 'Admin'
    };

    const result = await createUser(minimalInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.role).toEqual('Admin');
    expect(result.address).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should use default role when not specified', async () => {
    const inputWithoutRole = {
      name: 'Default User',
      email: 'default@example.com',
      password: 'password123'
      // role intentionally omitted to test default
    };

    const result = await createUser(inputWithoutRole);

    expect(result.role).toEqual('Customer');
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query database to verify user was saved
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('John Doe');
    expect(users[0].email).toEqual('john.doe@example.com');
    expect(users[0].role).toEqual('Customer');
    expect(users[0].address).toEqual('123 Main St');
    expect(users[0].phone).toEqual('+1234567890');
    expect(users[0].created_at).toBeInstanceOf(Date);
    expect(users[0].updated_at).toBeInstanceOf(Date);

    // Verify password was hashed
    expect(users[0].password).not.toEqual('password123');
    expect(users[0].password.length).toBeGreaterThan(20);
  });

  it('should hash password correctly', async () => {
    const result = await createUser(testInput);

    // Verify password can be verified with Bun's password utilities
    const isValidPassword = await Bun.password.verify('password123', result.password);
    expect(isValidPassword).toBe(true);

    // Verify wrong password fails
    const isInvalidPassword = await Bun.password.verify('wrongpassword', result.password);
    expect(isInvalidPassword).toBe(false);
  });

  it('should throw error for duplicate email', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create another user with the same email
    const duplicateInput: CreateUserInput = {
      name: 'Another User',
      email: 'john.doe@example.com', // Same email
      password: 'differentpassword',
      role: 'Admin'
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different email cases as duplicates', async () => {
    await createUser(testInput);

    // Try with different case
    const upperCaseEmailInput: CreateUserInput = {
      name: 'Another User',
      email: 'JOHN.DOE@EXAMPLE.COM',
      password: 'password123',
      role: 'Customer'
    };

    await expect(createUser(upperCaseEmailInput)).rejects.toThrow(/already exists/i);
  });

  it('should create users with different emails successfully', async () => {
    await createUser(testInput);

    const secondUserInput: CreateUserInput = {
      name: 'Jane Smith',
      email: 'jane.smith@example.com', // Different email
      password: 'password456',
      role: 'Admin'
    };

    const result = await createUser(secondUserInput);

    expect(result.name).toEqual('Jane Smith');
    expect(result.email).toEqual('jane.smith@example.com');
    expect(result.role).toEqual('Admin');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });
});