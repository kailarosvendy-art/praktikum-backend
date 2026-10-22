import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import bcrypt from 'bcryptjs';
import express from 'express';
import { test } from 'node:test';
import { errorHandler } from '../src/middlewares/errorHandler.ts';
import { createAuthRouter } from '../src/routes/authRouter.ts';
import type {
  AuthRepository,
} from '../src/services/authService.ts';
import type {
  UserAuthRecord,
  UserProfileRecord,
} from '../src/repositories/userRepository.ts';

test('register, login, and me authenticate without exposing password hashes', async (context) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  context.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  const users = new Map<string, UserAuthRecord>();
  let nextId = 1;
  const repository: AuthRepository = {
    async findByEmail(email) {
      return users.get(email);
    },
    async create(input): Promise<UserProfileRecord | undefined> {
      const user = {
        id: nextId++,
        name: input.name,
        email: input.email,
        passwordHash: input.passwordHash,
        role: 'customer' as const,
      };
      users.set(user.email, user);
      return { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: null };
    },
  };

  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', createAuthRouter(repository));
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  context.after(() => server.close());
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1/auth`;

  const register = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: '  Budi Santoso ',
      email: '  BUDI@example.com ',
      password: 'password123',
    }),
  });
  assert.equal(register.status, 201);
  const registration = (await register.json()) as {
    data: Record<string, unknown>;
  };
  assert.deepEqual(registration.data, {
    id: 1,
    name: 'Budi Santoso',
    email: 'budi@example.com',
    role: 'customer',
  });
  assert.equal('passwordHash' in registration.data, false);
  const storedUser = users.get('budi@example.com');
  assert.ok(storedUser);
  assert.notEqual(storedUser.passwordHash, 'password123');
  assert.match(storedUser.passwordHash, /^\$2[aby]\$/);
  assert.equal(await bcrypt.compare('password123', storedUser.passwordHash), true);

  const invalidRole = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    }),
  });
  assert.equal(invalidRole.status, 400);

  const shortName = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Bo', email: 'bo@example.com', password: 'password123' }),
  });
  assert.equal(shortName.status, 400);

  const duplicate = await fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Budi Santoso',
      email: 'budi@example.com',
      password: 'password123',
    }),
  });
  assert.equal(duplicate.status, 409);

  const badLogin = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'budi@example.com', password: 'incorrect123' }),
  });
  assert.equal(badLogin.status, 401);

  const login = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ' BUDI@example.com ', password: 'password123' }),
  });
  assert.equal(login.status, 200);
  const loginResponse = (await login.json()) as {
    data: { token: string; tokenType: string; expiresIn: string; user: Record<string, unknown> };
  };
  assert.equal(loginResponse.data.tokenType, 'Bearer');
  assert.equal(loginResponse.data.expiresIn, '2h');
  assert.equal('passwordHash' in loginResponse.data.user, false);

  const me = await fetch(`${baseUrl}/me`, {
    headers: { authorization: `Bearer ${loginResponse.data.token}` },
  });
  assert.equal(me.status, 200);
  assert.deepEqual((await me.json() as { data: unknown }).data, registration.data);

  const noToken = await fetch(`${baseUrl}/me`);
  assert.equal(noToken.status, 401);
  const invalidToken = await fetch(`${baseUrl}/me`, {
    headers: { authorization: 'Bearer invalid.token.value' },
  });
  assert.equal(invalidToken.status, 401);
});
