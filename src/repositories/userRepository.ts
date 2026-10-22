import { getDb } from '../db/index.ts';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema.ts';

export type UserRole = 'admin' | 'owner' | 'customer';

export interface UserAuthRecord {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserProfileRecord {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date | null;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
}

export class UserRepository {
  async findByEmail(email: string): Promise<UserAuthRecord | undefined> {
    const db = await getDb();
    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        passwordHash: users.passwordHash,
        role: users.role,
      })
      .from(users)
      .where(eq(users.email, email));
    return rows[0];
  }

  async findById(id: number) {
    const db = await getDb();
    const rows = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, id));
    return rows[0];
  }

  async findAll() {
    const db = await getDb();
    return db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(users.id);
  }

  async create(input: CreateUserInput): Promise<UserProfileRecord | undefined> {
    const db = await getDb();
    const rows = await db
      .insert(users)
      .output()
      .values({
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: 'customer',
      });
    const row = rows[0];
    if (!row) return undefined;
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt,
    };
  }
}