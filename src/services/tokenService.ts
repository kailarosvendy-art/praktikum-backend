import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { UserRole } from '../repositories/userRepository.ts';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32) {
    throw new Error('JWT_SECRET harus diatur dan memiliki minimal 32 byte');
  }
  return secret;
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    { name: user.name, email: user.email, role: user.role },
    getJwtSecret(),
    { algorithm: 'HS256', subject: String(user.id), expiresIn: '2h' },
  );
}

export function verifyToken(token: string): AuthUser {
  const payload = jwt.verify(token, getJwtSecret(), { algorithms: ['HS256'] });
  if (typeof payload === 'string') {
    throw new jwt.JsonWebTokenError('Payload token tidak valid');
  }

  const claims = payload as JwtPayload & Partial<AuthUser>;
  const id = Number(claims.sub);
  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof claims.name !== 'string' ||
    typeof claims.email !== 'string' ||
    (claims.role !== 'admin' && claims.role !== 'owner' && claims.role !== 'customer')
  ) {
    throw new jwt.JsonWebTokenError('Payload token tidak valid');
  }

  return { id, name: claims.name, email: claims.email, role: claims.role };
}
