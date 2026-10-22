import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import type { AddressInfo } from 'node:net';
import { errorHandler } from '../src/middlewares/errorHandler.ts';
import { validate } from '../src/middlewares/validate.ts';
import { authMeSchema, loginSchema, registerSchema } from '../src/schemas/authSchema.ts';
import {
  createStallReviewBodySchema,
  createStallReviewParamsSchema,
} from '../src/schemas/reviewSchema.ts';
import {
  createStallSchema,
  idParamSchema,
  stallQuerySchema,
  updateStallSchema,
} from '../src/schemas/stallSchema.ts';

test('schemas validate route data and normalize authentication email', () => {
  assert.equal(stallQuerySchema.parse({ page: '2', limit: '5' }).page, 2);
  assert.equal(idParamSchema.parse({ id: '42' }).id, 42);
  assert.equal(createStallSchema.safeParse({ name: 'Warung Baru' }).success, true);
  assert.equal(updateStallSchema.safeParse({}).success, true);
  assert.equal(createStallReviewParamsSchema.parse({ id: '4' }).id, 4);
  assert.equal(createStallReviewBodySchema.safeParse({ rating: 5 }).success, true);
  assert.equal(
    createStallReviewBodySchema.safeParse({ rating: 5, comment: 'x'.repeat(1001) }).success,
    false,
  );
  assert.equal(
    createStallReviewBodySchema.safeParse({ rating: 5, comment: ' x ' }).data?.comment,
    'x',
  );
  assert.equal(
    registerSchema.parse({ name: 'Budi', email: '  BUDI@EXAMPLE.COM ', password: 'password123' }).email,
    'budi@example.com',
  );
  assert.equal(
    registerSchema.safeParse({
      name: 'Budi',
      email: 'budi@example.com',
      password: 'password123',
      role: 'admin',
    }).success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({ name: 'Bo', email: 'budi@example.com', password: 'password123' })
      .success,
    false,
  );
  assert.equal(
    registerSchema.safeParse({
      name: 'Budi',
      email: 'budi@example.com',
      password: 'a'.repeat(73),
    }).success,
    false,
  );
  assert.equal(loginSchema.safeParse({ email: 'bad-email', password: 'x' }).success, false);
  assert.deepEqual(authMeSchema.parse(undefined), {});
});

test('validation middleware returns one structured error response', async (context) => {
  const app = express();
  app.use(express.json());
  app.get('/stalls', validate(stallQuerySchema, 'query'), (_req, res) => {
    res.json(res.locals.validated);
  });
  app.put(
    '/stalls/:id',
    validate(idParamSchema, 'params'),
    validate(updateStallSchema, 'body'),
    (_req, res) => res.json({ status: 'success' }),
  );
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  context.after(() => server.close());
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const invalidQuery = await fetch(`${baseUrl}/stalls?page=0`);
  assert.equal(invalidQuery.status, 400);
  assert.deepEqual(await invalidQuery.json(), {
    status: 'fail',
    message: 'Validasi gagal',
    errors: [{ field: 'page', message: 'page minimal 1' }],
  });

  const invalidParamsAndBody = await fetch(`${baseUrl}/stalls/no-id`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  });
  assert.equal(invalidParamsAndBody.status, 400);
  const paramsError = (await invalidParamsAndBody.json()) as {
    status: string;
    message: string;
    errors: { field: string }[];
  };
  assert.equal(paramsError.status, 'fail');
  assert.equal(paramsError.message, 'Validasi gagal');
  assert.equal(paramsError.errors[0]?.field, 'id');

  const invalidBody = await fetch(`${baseUrl}/stalls/1`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 42 }),
  });
  assert.equal(invalidBody.status, 400);
  const bodyError = (await invalidBody.json()) as { errors: { field: string }[] };
  assert.equal(bodyError.errors[0]?.field, 'name');

  const invalidJson = await fetch(`${baseUrl}/stalls/1`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: '{invalid json',
  });
  assert.equal(invalidJson.status, 400);
  const jsonError = (await invalidJson.json()) as { errors: { field: string }[] };
  assert.equal(jsonError.errors[0]?.field, 'body');
});
