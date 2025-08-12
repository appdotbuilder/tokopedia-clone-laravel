import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type UpdateUserInput, type CreateUserInput } from '../schema';
import { updateUser } from '../handlers/update_user';
import { eq } from 'drizzle-orm';

// Test data
const testUser: CreateUserInput = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
  role: 'Customer',
  address: '123 Test St',
  phone: '555-0123'
};

const anotherUser: CreateUserInput = {
  name: 'Another User',
  email: 'another@example.com',
  password: 'password456',
  role: 'Admin',
  address: '456 Another St',
  phone: '555-0456'
};

describe('updateUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update user name', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Updated Name'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.name).toBe('Updated Name');
    expect(result.email).toBe('test@example.com'); // Should remain unchanged
    expect(result.role).toBe('Customer'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update user email', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      email: 'updated@example.com'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.email).toBe('updated@example.com');
    expect(result.name).toBe('Test User'); // Should remain unchanged
  });

  it('should update user password', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;
    const originalPasswordHash = createdUser[0].password;

    const updateInput: UpdateUserInput = {
      id: userId,
      password: 'newpassword123'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.password).not.toBe(originalPasswordHash);
    expect(result.password).not.toBe('newpassword123'); // Should be hashed

    // Verify password was hashed correctly
    const isValid = await Bun.password.verify('newpassword123', result.password);
    expect(isValid).toBe(true);
  });

  it('should update user role', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      role: 'Admin'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.role).toBe('Admin');
    expect(result.name).toBe('Test User'); // Should remain unchanged
  });

  it('should update address and phone', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      address: '789 New Address',
      phone: '555-9999'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.address).toBe('789 New Address');
    expect(result.phone).toBe('555-9999');
    expect(result.name).toBe('Test User'); // Should remain unchanged
  });

  it('should update multiple fields at once', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Multi Update User',
      email: 'multiupdate@example.com',
      role: 'Admin',
      address: '999 Multi St',
      phone: '555-1111'
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.name).toBe('Multi Update User');
    expect(result.email).toBe('multiupdate@example.com');
    expect(result.role).toBe('Admin');
    expect(result.address).toBe('999 Multi St');
    expect(result.phone).toBe('555-1111');
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should set nullable fields to null', async () => {
    // Create test user with address and phone
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      address: null,
      phone: null
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.address).toBeNull();
    expect(result.phone).toBeNull();
    expect(result.name).toBe('Test User'); // Should remain unchanged
  });

  it('should persist changes to database', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Persisted Update',
      email: 'persisted@example.com'
    };

    await updateUser(updateInput);

    // Query database directly to verify changes were persisted
    const updatedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .execute();

    expect(updatedUser).toHaveLength(1);
    expect(updatedUser[0].name).toBe('Persisted Update');
    expect(updatedUser[0].email).toBe('persisted@example.com');
    expect(updatedUser[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when user does not exist', async () => {
    const updateInput: UpdateUserInput = {
      id: 999999, // Non-existent ID
      name: 'Non Existent'
    };

    expect(updateUser(updateInput)).rejects.toThrow(/user not found/i);
  });

  it('should throw error when email already exists', async () => {
    // Create two test users
    const user1 = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    await db.insert(usersTable)
      .values({
        ...anotherUser,
        password: await Bun.password.hash(anotherUser.password)
      })
      .returning()
      .execute();

    const updateInput: UpdateUserInput = {
      id: user1[0].id,
      email: 'another@example.com' // Email already taken by second user
    };

    expect(updateUser(updateInput)).rejects.toThrow(/email already exists/i);
  });

  it('should allow keeping same email', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Same Email User',
      email: 'test@example.com' // Same email as original
    };

    const result = await updateUser(updateInput);

    expect(result.id).toBe(userId);
    expect(result.name).toBe('Same Email User');
    expect(result.email).toBe('test@example.com');
  });

  it('should update timestamp correctly', async () => {
    // Create test user
    const createdUser = await db.insert(usersTable)
      .values({
        ...testUser,
        password: await Bun.password.hash(testUser.password)
      })
      .returning()
      .execute();

    const userId = createdUser[0].id;
    const originalUpdatedAt = createdUser[0].updated_at;

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateUserInput = {
      id: userId,
      name: 'Timestamp Test'
    };

    const result = await updateUser(updateInput);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    expect(result.created_at).toEqual(createdUser[0].created_at);
  });
});