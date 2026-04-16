/* eslint-disable @typescript-eslint/unbound-method */

import { ForbiddenException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { PaginationQueryDto } from '../shared/dto/pagination-query.dto';
import type { PaginatedResult } from '../shared/interfaces/paginated-result.interface';
import { Story } from '../stories/entities/story.entity';
import { User } from '../users/entities/user.entity';
import type { CreateRatingDto } from './dto/create-rating.dto';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingRepository: jest.Mocked<Repository<Rating>>;
  let mockManager: {
    findOne: jest.Mock;
  };

  const mockRating: Rating = {
    id: 1,
    score: 5,
    userId: 1,
    storyId: 1,
    user: {} as User,
    story: {} as Story,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockManager = {
      findOne: jest.fn(),
    };

    const mockRatingRepository = {
      manager: mockManager,
      upsert: jest.fn().mockResolvedValue(undefined),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      remove: jest.fn().mockResolvedValue(undefined),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: getRepositoryToken(Rating),
          useValue: mockRatingRepository,
        },
      ],
    }).compile();

    service = module.get<RatingsService>(RatingsService);
    ratingRepository = module.get(getRepositoryToken(Rating));
  });

  describe('create', () => {
    const createDto: CreateRatingDto = {
      score: 5,
      userId: 1,
      storyId: 1,
    };

    it('should upsert and return a rating', async () => {
      mockManager.findOne
        .mockResolvedValueOnce({ id: 1 } as Story)
        .mockResolvedValueOnce({ id: 1 } as User);
      ratingRepository.findOne.mockResolvedValue(mockRating);

      const result = await service.create(createDto);

      expect(mockManager.findOne).toHaveBeenCalledWith(Story, {
        where: { id: 1 },
      });
      expect(mockManager.findOne).toHaveBeenCalledWith(User, {
        where: { id: 1 },
      });
      expect(ratingRepository.upsert).toHaveBeenCalledWith(
        { userId: 1, storyId: 1, score: 5 },
        { conflictPaths: ['userId', 'storyId'] },
      );
      expect(ratingRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 1, storyId: 1 },
      });
      expect(result).toEqual(mockRating);
    });

    it('should throw NotFoundException when story not found', async () => {
      mockManager.findOne.mockResolvedValueOnce(null);

      await expect(service.create(createDto)).rejects.toThrow(
        'Story with id 1 not found',
      );
    });

    it('should throw NotFoundException when user not found', async () => {
      mockManager.findOne
        .mockResolvedValueOnce({ id: 1 } as Story)
        .mockResolvedValueOnce(null);

      await expect(service.create(createDto)).rejects.toThrow(
        'User with id 1 not found',
      );
    });
  });

  describe('findByStory', () => {
    it('should return paginated results with data, total, page, limit', async () => {
      const ratings = [mockRating];
      ratingRepository.findAndCount.mockResolvedValue([ratings, 1]);

      const query: PaginationQueryDto = { page: 1, limit: 20 };
      const result: PaginatedResult<Rating> = await service.findByStory(
        1,
        query,
      );

      expect(ratingRepository.findAndCount).toHaveBeenCalledWith({
        where: { storyId: 1 },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({ data: ratings, total: 1, page: 1, limit: 20 });
    });

    it('should use default pagination when page and limit are not provided', async () => {
      ratingRepository.findAndCount.mockResolvedValue([[], 0]);

      const query: PaginationQueryDto = {};
      const result: PaginatedResult<Rating> = await service.findByStory(
        1,
        query,
      );

      expect(ratingRepository.findAndCount).toHaveBeenCalledWith({
        where: { storyId: 1 },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 20,
      });
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 20 });
    });

    it('should return paginated results with custom page and limit', async () => {
      const ratings = [mockRating];
      ratingRepository.findAndCount.mockResolvedValue([ratings, 50]);

      const query: PaginationQueryDto = { page: 3, limit: 10 };
      const result: PaginatedResult<Rating> = await service.findByStory(
        1,
        query,
      );

      expect(ratingRepository.findAndCount).toHaveBeenCalledWith({
        where: { storyId: 1 },
        order: { createdAt: 'DESC' },
        skip: 20,
        take: 10,
      });
      expect(result).toEqual({ data: ratings, total: 50, page: 3, limit: 10 });
    });
  });

  describe('getStoryRatingSummary', () => {
    it('should return average score and total count', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          averageScore: '4.5000000',
          totalRatings: '10',
        }),
      };
      ratingRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as ReturnType<
          Repository<Rating>['createQueryBuilder']
        >,
      );

      const result = await service.getStoryRatingSummary(1);

      expect(ratingRepository.createQueryBuilder).toHaveBeenCalledWith(
        'rating',
      );
      expect(mockQueryBuilder.select).toHaveBeenCalledWith(
        'AVG(rating.score)',
        'averageScore',
      );
      expect(mockQueryBuilder.addSelect).toHaveBeenCalledWith(
        'COUNT(rating.id)',
        'totalRatings',
      );
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'rating.storyId = :storyId',
        {
          storyId: 1,
        },
      );
      expect(result).toEqual({
        storyId: 1,
        averageScore: 4.5,
        totalRatings: 10,
      });
    });

    it('should return zeros when no ratings exist', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getRawOne: jest.fn().mockResolvedValue({
          averageScore: null,
          totalRatings: null,
        }),
      };
      ratingRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as unknown as ReturnType<
          Repository<Rating>['createQueryBuilder']
        >,
      );

      const result = await service.getStoryRatingSummary(1);

      expect(result).toEqual({
        storyId: 1,
        averageScore: 0,
        totalRatings: 0,
      });
    });
  });

  describe('delete', () => {
    it('should remove a rating', async () => {
      ratingRepository.findOne.mockResolvedValue(mockRating);

      await service.delete(1, 1);

      expect(ratingRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(ratingRepository.remove).toHaveBeenCalledWith(mockRating);
    });

    it('should throw NotFoundException when rating not found', async () => {
      ratingRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.delete(1, 1)).rejects.toThrow(
        'Rating with id 1 not found',
      );
    });

    it('should throw ForbiddenException when deleting another user rating', async () => {
      ratingRepository.findOne.mockResolvedValue({ ...mockRating, userId: 2 });

      await expect(service.delete(1, 1)).rejects.toThrow(ForbiddenException);
      await expect(service.delete(1, 1)).rejects.toThrow(
        'You can only delete your own ratings',
      );
      expect(ratingRepository.remove).not.toHaveBeenCalled();
    });
  });
});
