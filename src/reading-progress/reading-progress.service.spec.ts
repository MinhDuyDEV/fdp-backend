/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Story } from '../stories/entities/story.entity';
import { User } from '../users/entities/user.entity';
import { ReadingProgress } from './entities/reading-progress.entity';
import { ReadingProgressService } from './reading-progress.service';
import { ReadingProgressManager } from './singleton/reading-progress-manager';

type MockRepository = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  manager: {
    findOne: jest.Mock;
  };
};

describe('ReadingProgressService', () => {
  let service: ReadingProgressService;
  let progressRepository: MockRepository;
  let progressManager: {
    getProgress: jest.Mock;
    setProgress: jest.Mock;
  };

  beforeEach(async () => {
    progressRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      manager: {
        findOne: jest.fn(),
      },
    };

    progressManager = {
      getProgress: jest.fn(),
      setProgress: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadingProgressService,
        {
          provide: getRepositoryToken(ReadingProgress),
          useValue: progressRepository,
        },
        {
          provide: ReadingProgressManager,
          useValue: progressManager,
        },
      ],
    }).compile();

    service = module.get<ReadingProgressService>(ReadingProgressService);
  });

  const mockStory = { id: 1 } as Story;
  const mockChapter = { id: 2 } as Chapter;
  const mockUser = { id: 3 } as User;

  const setAllFkExists = () => {
    progressRepository.manager.findOne.mockImplementation((entity: unknown) => {
      if (entity === Story) return Promise.resolve(mockStory);
      if (entity === Chapter) return Promise.resolve(mockChapter);
      if (entity === User) return Promise.resolve(mockUser);
      return Promise.resolve(null);
    });
  };

  describe('saveProgress', () => {
    it('should save progress with valid data (new record)', async () => {
      setAllFkExists();
      progressRepository.findOne.mockResolvedValue(null);

      const created: ReadingProgress = {
        id: 0,
        userId: 3,
        storyId: 1,
        chapterId: 2,
        scrollPosition: 150,
        readingMode: 'day',
        lastReadAt: new Date(),
      } as ReadingProgress;

      const saved: ReadingProgress = {
        ...created,
        id: 10,
      } as ReadingProgress;

      progressRepository.create.mockReturnValue(created);
      progressRepository.save.mockResolvedValue(saved);

      const result = await service.saveProgress(3, 1, 2, 150, 'day');

      expect(progressRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 3, storyId: 1 },
      });
      expect(progressRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 3,
          storyId: 1,
          chapterId: 2,
          scrollPosition: 150,
          readingMode: 'day',
          lastReadAt: expect.any(Date),
        }),
      );
      expect(progressRepository.save).toHaveBeenCalledWith(created);
      expect(progressManager.setProgress).toHaveBeenCalledWith(3, 1, saved);
      expect(result).toBe(saved);
    });

    it('should throw NotFoundException when story does not exist', async () => {
      progressRepository.manager.findOne.mockImplementation(
        (entity: unknown) => {
          if (entity === Story) return Promise.resolve(null);
          return Promise.resolve({ id: 1 });
        },
      );

      await expect(
        service.saveProgress(3, 99, 2, 100, 'night'),
      ).rejects.toThrow(new NotFoundException('Story with id 99 not found'));

      expect(progressRepository.findOne).not.toHaveBeenCalled();
      expect(progressRepository.save).not.toHaveBeenCalled();
      expect(progressManager.setProgress).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when chapter does not exist', async () => {
      progressRepository.manager.findOne.mockImplementation(
        (entity: unknown) => {
          if (entity === Story) return Promise.resolve(mockStory);
          if (entity === Chapter) return Promise.resolve(null);
          return Promise.resolve(mockUser);
        },
      );

      await expect(
        service.saveProgress(3, 1, 404, 100, 'night'),
      ).rejects.toThrow(new NotFoundException('Chapter with id 404 not found'));

      expect(progressRepository.findOne).not.toHaveBeenCalled();
      expect(progressRepository.save).not.toHaveBeenCalled();
      expect(progressManager.setProgress).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      progressRepository.manager.findOne.mockImplementation(
        (entity: unknown) => {
          if (entity === Story) return Promise.resolve(mockStory);
          if (entity === Chapter) return Promise.resolve(mockChapter);
          if (entity === User) return Promise.resolve(null);
          return Promise.resolve(null);
        },
      );

      await expect(
        service.saveProgress(777, 1, 2, 100, 'night'),
      ).rejects.toThrow(new NotFoundException('User with id 777 not found'));

      expect(progressRepository.findOne).not.toHaveBeenCalled();
      expect(progressRepository.save).not.toHaveBeenCalled();
      expect(progressManager.setProgress).not.toHaveBeenCalled();
    });

    it('should update existing progress when a record already exists', async () => {
      setAllFkExists();

      const existing: ReadingProgress = {
        id: 15,
        userId: 3,
        storyId: 1,
        chapterId: 1,
        scrollPosition: 50,
        readingMode: 'day',
        lastReadAt: new Date('2024-01-01T00:00:00.000Z'),
      } as ReadingProgress;

      progressRepository.findOne.mockResolvedValue(existing);
      progressRepository.save.mockImplementation(
        (entity: ReadingProgress) => entity,
      );

      const result = await service.saveProgress(3, 1, 8, 400, 'scroll');

      expect(progressRepository.create).not.toHaveBeenCalled();
      expect(existing.chapterId).toBe(8);
      expect(existing.scrollPosition).toBe(400);
      expect(existing.readingMode).toBe('scroll');
      expect(existing.lastReadAt).toBeInstanceOf(Date);
      expect(progressRepository.save).toHaveBeenCalledWith(existing);
      expect(progressManager.setProgress).toHaveBeenCalledWith(3, 1, result);
    });
  });

  describe('getProgress', () => {
    it('should return cached value when present', async () => {
      const cached: ReadingProgress = {
        id: 5,
        userId: 3,
        storyId: 1,
        chapterId: 2,
        scrollPosition: 320,
        readingMode: 'night',
        lastReadAt: new Date(),
      } as ReadingProgress;

      progressManager.getProgress.mockReturnValue(cached);

      const result = await service.getProgress(3, 1);

      expect(progressManager.getProgress).toHaveBeenCalledWith(3, 1);
      expect(progressRepository.findOne).not.toHaveBeenCalled();
      expect(result).toBe(cached);
    });

    it('should fall back to database when cache miss and populate cache', async () => {
      const fromDb: ReadingProgress = {
        id: 11,
        userId: 3,
        storyId: 1,
        chapterId: 4,
        scrollPosition: 210,
        readingMode: 'page-flip',
        lastReadAt: new Date(),
      } as ReadingProgress;

      progressManager.getProgress.mockReturnValue(undefined);
      progressRepository.findOne.mockResolvedValue(fromDb);

      const result = await service.getProgress(3, 1);

      expect(progressRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 3, storyId: 1 },
      });
      expect(progressManager.setProgress).toHaveBeenCalledWith(3, 1, fromDb);
      expect(result).toBe(fromDb);
    });

    it('should throw NotFoundException when cache miss and database has no progress', async () => {
      progressManager.getProgress.mockReturnValue(undefined);
      progressRepository.findOne.mockResolvedValue(null);

      await expect(service.getProgress(3, 1)).rejects.toThrow(
        new NotFoundException(
          'No reading progress found for user 3 and story 1',
        ),
      );

      expect(progressManager.setProgress).not.toHaveBeenCalled();
    });
  });
});
