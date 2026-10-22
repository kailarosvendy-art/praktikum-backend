import {
  StallRepository,
  type CreateStallInput,
  type FindAllParams,
} from '../repositories/stallRepository.ts';
import { MenuItemRepository } from '../repositories/menuItemRepository.ts';
import type { MenuItemDto, StallResponseDto } from '../dtos/stallDto.ts';
import type { AuthUser } from './tokenService.ts';
import { AppError } from '../errors/AppError.ts';

type StallRow = NonNullable<Awaited<ReturnType<StallRepository['findById']>>>;
type StallStore = Pick<
  StallRepository,
  'findAll' | 'findById' | 'create' | 'update' | 'remove'
>;
type MenuItemStore = Pick<MenuItemRepository, 'findByStallId'>;

export class StallService {
  constructor(
    private readonly stallRepository: StallStore = new StallRepository(),
    private readonly menuItemRepository: MenuItemStore = new MenuItemRepository(),
  ) {}

  // Mapping row DB -> DTO API (sekaligus logika bisnis isPopular).
  private toDto(row: StallRow): StallResponseDto {
    const avgRating = Number(row.avgRating);
    return {
      id: row.id,
      ownerId: row.ownerId,
      name: row.name,
      category: row.category,
      location: row.location,
      description: row.description,
      avgRating,
      reviewCount: row.reviewCount,
      isPopular: avgRating >= 4.7,
    };
  }

  async getAllStalls(params: FindAllParams) {
    const { rows, total } = await this.stallRepository.findAll(params);
    return { data: rows.map((row) => this.toDto(row)), total };
  }

  async getStallById(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new Error('STALL_NOT_FOUND');
    return this.toDto(row);
  }

  async getStallMenus(id: number): Promise<MenuItemDto[]> {
    const row = await this.stallRepository.findById(id);
    if (!row) throw new Error('STALL_NOT_FOUND');
    return this.menuItemRepository.findByStallId(id);
  }

  async createStall(input: CreateStallInput): Promise<StallResponseDto> {
    const row = await this.stallRepository.create(input);
    if (!row) throw new Error('STALL_NOT_FOUND');
    return this.toDto(row);
  }

  async updateStall(
    id: number,
    input: Partial<Omit<CreateStallInput, 'ownerId'>>,
    user: AuthUser,
  ): Promise<StallResponseDto> {
    const existing = await this.stallRepository.findById(id);
    if (!existing) throw new Error('STALL_NOT_FOUND');
    if (user.role !== 'admin' && existing.ownerId !== user.id) {
      throw new AppError(403, 'Anda tidak berhak mengubah warung ini');
    }
    if (Object.keys(input).length === 0) return this.toDto(existing);
    const row = await this.stallRepository.update(id, input);
    if (!row) throw new Error('STALL_NOT_FOUND');
    return this.toDto(row);
  }

  async deleteStall(id: number): Promise<StallResponseDto> {
    const row = await this.stallRepository.remove(id);
    if (!row) throw new Error('STALL_NOT_FOUND');
    return this.toDto(row);
  }
}
