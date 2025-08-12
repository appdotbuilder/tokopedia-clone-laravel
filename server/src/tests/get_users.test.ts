import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user data
const testUsers: CreateUserInput[] = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'Customer',
    address: '123 Main St',
    phone: '555-0123'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'secret456',
    role: 'Admin',
    address: '456 Oak Ave',
    phone: '555-0456'
  },
  {
    name: 'Bob Wilson',
    email: 'bob@example.com',
    password: 'mypassword',
    role: 'Customer',
    address: null,
    phone: null
  }
];

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    
    expect(result).toEqual([]);
  });

  it('should fetch all users from database', async () => {
    // Create test users
    for (const userData of testUsers) {
      await db.insert(usersTable).values(userData).execute();
    }

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('John Doe');
    expect(result[1].name).toEqual('Jane Smith');
    expect(result[2].name).toEqual('Bob Wilson');
  });

  it('should exclude password field from results', async () => {
    // Create a test user
    await db.insert(usersTable).values(testUsers[0]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).not.toHaveProperty('password');
    expect(result[0].name).toEqual('John Doe');
    expect(result[0].email).toEqual('john@example.com');
    expect(result[0].role).toEqual('Customer');
  });

  it('should return all user fields except password', async () => {
    // Create user with all fields populated
    await db.insert(usersTable).values(testUsers[0]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    // Check all expected fields are present
    expect(user.id).toBeDefined();
    expect(user.name).toEqual('John Doe');
    expect(user.email).toEqual('john@example.com');
    expect(user.role).toEqual('Customer');
    expect(user.address).toEqual('123 Main St');
    expect(user.phone).toEqual('555-0123');
    expect(user.created_at).toBeInstanceOf(Date);
    expect(user.updated_at).toBeInstanceOf(Date);

    // Ensure password is not included
    expect(user).not.toHaveProperty('password');
  });

  it('should handle users with null optional fields', async () => {
    // Create user with null address and phone
    await db.insert(usersTable).values(testUsers[2]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];

    expect(user.name).toEqual('Bob Wilson');
    expect(user.email).toEqual('bob@example.com');
    expect(user.address).toBeNull();
    expect(user.phone).toBeNull();
    expect(user).not.toHaveProperty('password');
  });

  it('should return users with different roles', async () => {
    // Create users with different roles
    await db.insert(usersTable).values([testUsers[0], testUsers[1]]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(2);
    
    const customerUser = result.find(u => u.role === 'Customer');
    const adminUser = result.find(u => u.role === 'Admin');

    expect(customerUser).toBeDefined();
    expect(customerUser!.name).toEqual('John Doe');
    expect(adminUser).toBeDefined();
    expect(adminUser!.name).toEqual('Jane Smith');
  });

  it('should return users ordered by database insertion order', async () => {
    // Insert users in a specific order
    await db.insert(usersTable).values(testUsers[1]).execute(); // Jane first
    await db.insert(usersTable).values(testUsers[0]).execute(); // John second
    await db.insert(usersTable).values(testUsers[2]).execute(); // Bob third

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Jane Smith');
    expect(result[1].name).toEqual('John Doe');
    expect(result[2].name).toEqual('Bob Wilson');
  });
});