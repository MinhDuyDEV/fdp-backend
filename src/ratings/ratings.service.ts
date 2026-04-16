import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import type { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { Story } from '../stories/entities/story.entity';
import { User } from '../users/entities/user.entity';
import type { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './entities/rating.entity';

@Injectable()
export class RatingsService {
  constructor(
    @InjectRepository(Rating)
    private readonly ratingRepository: Repository<Rating>,
  ) {}

  async create(dto: CreateRatingDto): Promise<Rating> {
    // FK existence checks
    const story = await this.ratingRepository.manager.findOne(Story, {
      where: { id: dto.storyId },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${dto.storyId} not found`);
    }

    const user = await this.ratingRepository.manager.findOne(User, {
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${dto.userId} not found`);
    }

    await this.ratingRepository.upsert(
      {
        userId: dto.userId,
        storyId: dto.storyId,
        score: dto.score,
      },
      {
        conflictPaths: ['userId', 'storyId'],
      },
    );

    const rating = await this.ratingRepository.findOne({
      where: { userId: dto.userId, storyId: dto.storyId },
    });
    if (!rating) {
      throw new NotFoundException(
        `Rating for user ${dto.userId} and story ${dto.storyId} not found`,
      );
    }

    return rating;
  }

  async findByStory(
    storyId: number,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Rating>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await this.ratingRepository.findAndCount({
      where: { storyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async getStoryRatingSummary(storyId: number): Promise<{
    storyId: number;
    averageScore: number;
    totalRatings: number;
  }> {
    const result:
      | { averageScore: string | null; totalRatings: string | null }
      | undefined = await this.ratingRepository
      .createQueryBuilder('rating')
      .select('AVG(rating.score)', 'averageScore')
      .addSelect('COUNT(rating.id)', 'totalRatings')
      .where('rating.storyId = :storyId', { storyId })
      .getRawOne();

    return {
      storyId,
      averageScore: result?.averageScore
        ? parseFloat(parseFloat(result.averageScore).toFixed(2))
        : 0,
      totalRatings: result?.totalRatings
        ? parseInt(result.totalRatings, 10)
        : 0,
    };
  }

  async delete(id: number, currentUserId: number): Promise<void> {
    const rating = await this.ratingRepository.findOne({ where: { id } });
    if (!rating) {
      throw new NotFoundException(`Rating with id ${id} not found`);
    }
    if (rating.userId !== currentUserId) {
      throw new ForbiddenException('You can only delete your own ratings');
    }
    await this.ratingRepository.remove(rating);
  }
}
