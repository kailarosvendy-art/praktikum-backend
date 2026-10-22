import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { test } from 'node:test';
import type { StallResponseDto, MenuItemDto } from '../src/dtos/stallDto.ts';
import type { CreateReviewInput } from '../src/repositories/reviewRepository.ts';
import type { UserRole } from '../src/repositories/userRepository.ts';
import { errorHandler } from '../src/middlewares/errorHandler.ts';
import { createStallRouter } from '../src/routes/stallRouter.ts';
import { userRouter } from '../src/routes/userRouter.ts';
import { menuItemRouter } from '../src/routes/menuItemRouter.ts';
import { reviewRouter } from '../src/routes/reviewRouter.ts';
import { likeRouter } from '../src/routes/likeRouter.ts';
import { flagRouter } from '../src/routes/flagRouter.ts';
import { auditRouter } from '../src/routes/auditRouter.ts';
import { ReviewController } from '../src/controllers/reviewController.ts';
import { StallController } from '../src/controllers/stallController.ts';
import { StallService } from '../src/services/stallService.ts';
import { signToken } from '../src/services/tokenService.ts';
import type { StallRepository } from '../src/repositories/stallRepository.ts';

test('stall permissions enforce authentication, roles, ownership, and token identity', async (context) => {
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  context.after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  });

  type StallRow = NonNullable<Awaited<ReturnType<StallRepository['findById']>>>;
  const stalls = new Map<number, StallRow>([
    [1, makeStallRow(1, 10, 'Owned stall')],
    [2, makeStallRow(2, 20, 'Another stall')],
  ]);
  let nextStallId = 3;
  const stallRepository: ConstructorParameters<typeof StallService>[0] = {
    async findAll() {
      return { rows: [...stalls.values()], total: stalls.size };
    },
    async findById(id) {
      return stalls.get(id);
    },
    async create(input) {
      const row = makeStallRow(nextStallId++, input.ownerId, input.name, input);
      stalls.set(row.id, row);
      return row;
    },
    async update(id, input) {
      const existing = stalls.get(id);
      if (!existing) return undefined;
      const row = { ...existing, ...input };
      stalls.set(id, row);
      return row;
    },
    async remove(id) {
      const existing = stalls.get(id);
      if (existing) stalls.delete(id);
      return existing;
    },
  };

  let savedReview: CreateReviewInput | undefined;
  const reviewController = new ReviewController({
    async getAllReviews() {
      return [];
    },
    async createReview(input) {
      savedReview = input;
      return { id: 1, ...input };
    },
    async deleteReview(id) {
      return { id };
    },
  });

  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1/stalls',
    createStallRouter(
      new StallController(new StallService(stallRepository, { async findByStallId() { return [] as MenuItemDto[]; } })),
      reviewController,
    ),
  );
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/menu-items', menuItemRouter);
  app.use('/api/v1/reviews', reviewRouter);
  app.use('/api/v1/likes', likeRouter);
  app.use('/api/v1/flags', flagRouter);
  app.use('/api/v1/audit', auditRouter);
  app.use(errorHandler);
  const server = app.listen(0, '127.0.0.1');
  context.after(() => server.close());
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}/api/v1/stalls`;
  const tokenFor = (id: number, role: UserRole) =>
    signToken({ id, name: `User ${id}`, email: `${role}${id}@example.com`, role });
  const request = (path: string, method: string, role?: UserRole, id = 10, body?: unknown) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(role ? { authorization: `Bearer ${tokenFor(id, role)}` } : {}),
        ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

  assert.equal((await request('/', 'POST', undefined, 10, { name: 'No auth' })).status, 401);
  assert.equal((await request('/', 'POST', 'customer', 30, { name: 'Forbidden' })).status, 403);
  assert.equal((await request('/', 'GET')).status, 200);
  assert.equal((await request('/1', 'GET')).status, 200);
  for (const path of [
    '/api/v1/users',
    '/api/v1/menu-items',
    '/api/v1/reviews',
    '/api/v1/likes',
    '/api/v1/flags',
    '/api/v1/audit',
  ]) {
    assert.equal((await fetch(`http://127.0.0.1:${address.port}${path}`)).status, 401, path);
    assert.equal(
      (await fetch(`http://127.0.0.1:${address.port}${path}`, {
        headers: { authorization: `Bearer ${tokenFor(30, 'customer')}` },
      })).status,
      403,
      path,
    );
  }
  assert.equal((await request('/1/menus', 'GET', undefined)).status, 401);

  const ownerCreate = await request('/', 'POST', 'owner', 10, { name: 'New stall' });
  assert.equal(ownerCreate.status, 201);
  const created = (await ownerCreate.json()) as { data: StallResponseDto };
  assert.equal(created.data.ownerId, 10);

  const spoofedOwnerCreate = await request('/', 'POST', 'owner', 10, {
    name: 'Spoofed owner',
    ownerId: 20,
  });
  assert.equal(spoofedOwnerCreate.status, 400);

  assert.equal((await request('/2', 'PUT', 'owner', 10, { name: 'Not mine' })).status, 403);
  assert.equal((await request('/1', 'PUT', 'owner', 10, { name: 'Mine updated' })).status, 200);
  assert.equal((await request('/1', 'PUT', 'owner', 10, { ownerId: 20 })).status, 400);
  assert.equal((await request('/1', 'PUT', 'customer', 30, { name: 'No permission' })).status, 403);
  assert.equal((await request('/2', 'PUT', 'admin', 1, { name: 'Admin update' })).status, 200);
  assert.equal((await request('/1', 'DELETE', 'owner', 10)).status, 403);
  assert.equal((await request('/1', 'DELETE', 'admin', 1)).status, 200);

  assert.equal((await request('/2/reviews', 'POST', undefined, 30, { rating: 5 })).status, 401);
  const spoofedReview = await request('/2/reviews', 'POST', 'customer', 30, {
    rating: 5,
    userId: 10,
  });
  assert.equal(spoofedReview.status, 400);

  const review = await request('/2/reviews', 'POST', 'customer', 30, {
    rating: 5,
    comment: 'Bagus',
  });
  assert.equal(review.status, 201);
  assert.equal(savedReview?.stallId, 2);
  assert.equal(savedReview?.userId, 30);

  assert.equal((await request('/2/reviews', 'POST', 'owner', 10, { rating: 4 })).status, 201);
  assert.equal(savedReview?.userId, 10);
  assert.equal((await request('/2/reviews', 'POST', 'admin', 1, { rating: 3 })).status, 201);
  assert.equal(savedReview?.userId, 1);
});

function makeStallRow(
  id: number,
  ownerId: number,
  name: string,
  partial: Partial<StallResponseDto> = {},
): NonNullable<Awaited<ReturnType<StallRepository['findById']>>> {
  return {
    id,
    ownerId,
    name,
    category: partial.category ?? null,
    location: partial.location ?? null,
    description: partial.description ?? null,
    avgRating: String(partial.avgRating ?? 0),
    reviewCount: partial.reviewCount ?? 0,
    createdAt: null,
  };
}
