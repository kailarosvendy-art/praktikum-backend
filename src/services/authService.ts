import bcrypt from 'bcryptjs';
import { AppError } from '../errors/AppError.ts';
import type { LoginInput, RegisterInput } from '../schemas/authSchema.ts';
import type { UserAuthRecord, UserProfileRecord, UserRole } from '../repositories/userRepository.ts';
import { UserRepository } from '../repositories/userRepository.ts';
import { signToken, type AuthUser } from './tokenService.ts';

export interface AuthRepository {
  findByEmail(email: string): Promise<UserAuthRecord | undefined>;
  create(input: { name: string; email: string; passwordHash: string }): Promise<UserProfileRecord | undefined>;
}

export interface AuthUserDto {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponseDto {
  token: string;
  tokenType: 'Bearer';
  expiresIn: '2h';
  user: AuthUserDto;
}

const BCRYPT_SALT_ROUNDS = 12;

function toDto(user: UserAuthRecord | UserProfileRecord): AuthUserDto {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export class AuthService {
  constructor(private readonly userRepository: AuthRepository = new UserRepository()) {}

  async register(input: RegisterInput): Promise<AuthUserDto> {
    if (await this.userRepository.findByEmail(input.email)) {
      throw new AppError(409, 'Email sudah terdaftar');
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);
    let user: UserProfileRecord | undefined;
    try {
      user = await this.userRepository.create({
        name: input.name,
        email: input.email,
        passwordHash,
      });
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'number' in error &&
        (error.number === 2601 || error.number === 2627)
      ) {
        throw new AppError(409, 'Email sudah terdaftar');
      }
      throw error;
    }
    if (!user) throw new AppError(500, 'User gagal dibuat');

    return toDto(user);
  }

  async login(input: LoginInput): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, 'Email atau password salah');
    }

    const profile = toDto(user);
    const authUser: AuthUser = profile;
    return {
      token: signToken(authUser),
      tokenType: 'Bearer',
      expiresIn: '2h',
      user: profile,
    };
  }
}
