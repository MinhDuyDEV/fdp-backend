import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { Story } from '../stories/entities/story.entity';
import { ChaptersService } from './chapters.service';
import type { CreateChapterDto } from './dto/create-chapter.dto';
import { Chapter } from './entities/chapter.entity';

type MockQueryBuilder = {
  where: jest.Mock;
  andWhere: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  getOne: jest.Mock;
};

describe('ChaptersService', () => {
  let service: ChaptersService;

  let chapterRepository: {
    findOne: jest.Mock;
    findAndCount: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
    createQueryBuilder: jest.Mock;
    manager: {
      findOne: jest.Mock;
    };
  };

  let notificationsService: {
    notifyChapterUpdate: jest.Mock;
  };

  const makeQueryBuilder = (getOneResult: Chapter | null): MockQueryBuilder => {
    const qb: MockQueryBuilder = {
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      limit: jest.fn(),
      getOne: jest.fn().mockResolvedValue(getOneResult),
    };

    qb.where.mockReturnValue(qb);
    qb.andWhere.mockReturnValue(qb);
    qb.orderBy.mockReturnValue(qb);
    qb.limit.mockReturnValue(qb);

    return qb;
  };

  beforeEach(async () => {
    chapterRepository = {
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
      manager: {
        findOne: jest.fn(),
      },
    };

    notificationsService = {
      notifyChapterUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChaptersService,
        {
          provide: getRepositoryToken(Chapter),
          useValue: chapterRepository,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<ChaptersService>(ChaptersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create chapter and notify subscribers when story exists', async () => {
      const dto: CreateChapterDto = {
        title: 'Chapter 1',
        content: 'Content',
        chapterNumber: 1,
        storyId: 10,
      };

      const created = { ...dto } as Chapter;
      const saved = { ...dto, id: 99 } as Chapter;

      chapterRepository.manager.findOne.mockResolvedValue({
        id: dto.storyId,
      } as Story);
      chapterRepository.create.mockReturnValue(created);
      chapterRepository.save.mockResolvedValue(saved);

      const result = await service.create(dto);

      expect(chapterRepository.manager.findOne).toHaveBeenCalledWith(Story, {
        where: { id: dto.storyId },
      });
      expect(chapterRepository.create).toHaveBeenCalledWith(dto);
      expect(chapterRepository.save).toHaveBeenCalledWith(created);
      expect(notificationsService.notifyChapterUpdate).toHaveBeenCalledWith(
        dto.storyId,
        saved.id,
        saved.title,
      );
      expect(result).toEqual(saved);
    });

    it('should throw NotFoundException when story does not exist', async () => {
      const dto: CreateChapterDto = {
        title: 'Chapter 1',
        content: 'Content',
        chapterNumber: 1,
        storyId: 404,
      };

      chapterRepository.manager.findOne.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
      await expect(service.create(dto)).rejects.toThrow(
        'Story with id 404 not found',
      );

      expect(chapterRepository.create).not.toHaveBeenCalled();
      expect(chapterRepository.save).not.toHaveBeenCalled();
      expect(notificationsService.notifyChapterUpdate).not.toHaveBeenCalled();
    });
  });

  describe('findByStory', () => {
    it('should return paginated chapters with default pagination', async () => {
      const chapters = [
        { id: 1, storyId: 1, chapterNumber: 1 },
        { id: 2, storyId: 1, chapterNumber: 2 },
      ] as Chapter[];

      chapterRepository.findAndCount.mockResolvedValue([chapters, 2]);

      const result = await service.findByStory(1);

      expect(chapterRepository.findAndCount).toHaveBeenCalledWith({
        where: { storyId: 1 },
        order: { chapterNumber: 'ASC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        data: chapters,
        meta: {
          totalItems: 2,
          itemsPerPage: 10,
          totalPages: 1,
          currentPage: 1,
        },
      });
    });

    it('should return paginated chapters with custom pagination', async () => {
      const chapters = [{ id: 3, storyId: 1, chapterNumber: 3 }] as Chapter[];
      chapterRepository.findAndCount.mockResolvedValue([chapters, 21]);

      const result = await service.findByStory(1, { page: 2, limit: 5 });

      expect(chapterRepository.findAndCount).toHaveBeenCalledWith({
        where: { storyId: 1 },
        order: { chapterNumber: 'ASC' },
        skip: 5,
        take: 5,
      });
      expect(result.meta).toEqual({
        totalItems: 21,
        itemsPerPage: 5,
        totalPages: 5,
        currentPage: 2,
      });
    });
  });

  describe('findOne', () => {
    it('should return chapter when found', async () => {
      const chapter = { id: 7, storyId: 1, chapterNumber: 1 } as Chapter;
      chapterRepository.findOne.mockResolvedValue(chapter);

      const result = await service.findOne(7);

      expect(chapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: 7 },
      });
      expect(result).toEqual(chapter);
    });

    it('should throw NotFoundException when chapter not found', async () => {
      chapterRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Chapter with id 999 not found',
      );
    });
  });

  describe('nextChapter', () => {
    it('should return next chapter when available', async () => {
      const current = { id: 2, storyId: 1, chapterNumber: 2 } as Chapter;
      const next = { id: 3, storyId: 1, chapterNumber: 3 } as Chapter;

      chapterRepository.findOne.mockResolvedValue(current);
      const qb = makeQueryBuilder(next);
      chapterRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.nextChapter(1, 2);

      expect(chapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2, storyId: 1 },
      });
      expect(chapterRepository.createQueryBuilder).toHaveBeenCalledWith(
        'chapter',
      );
      expect(qb.where).toHaveBeenCalledWith('chapter.storyId = :storyId', {
        storyId: 1,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'chapter.chapterNumber > :currentNumber',
        {
          currentNumber: 2,
        },
      );
      expect(qb.orderBy).toHaveBeenCalledWith('chapter.chapterNumber', 'ASC');
      expect(qb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(next);
    });

    it('should throw NotFoundException when current chapter is missing', async () => {
      chapterRepository.findOne.mockResolvedValue(null);

      await expect(service.nextChapter(1, 404)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.nextChapter(1, 404)).rejects.toThrow(
        'Chapter with id 404 not found in story 1',
      );
      expect(chapterRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return null when current chapter is the last chapter', async () => {
      const current = { id: 3, storyId: 1, chapterNumber: 3 } as Chapter;

      chapterRepository.findOne.mockResolvedValue(current);
      const qb = makeQueryBuilder(null);
      chapterRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.nextChapter(1, 3);

      expect(result).toBeNull();
    });
  });

  describe('previousChapter', () => {
    it('should return previous chapter when available', async () => {
      const current = { id: 2, storyId: 1, chapterNumber: 2 } as Chapter;
      const previous = { id: 1, storyId: 1, chapterNumber: 1 } as Chapter;

      chapterRepository.findOne.mockResolvedValue(current);
      const qb = makeQueryBuilder(previous);
      chapterRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.previousChapter(1, 2);

      expect(chapterRepository.findOne).toHaveBeenCalledWith({
        where: { id: 2, storyId: 1 },
      });
      expect(chapterRepository.createQueryBuilder).toHaveBeenCalledWith(
        'chapter',
      );
      expect(qb.where).toHaveBeenCalledWith('chapter.storyId = :storyId', {
        storyId: 1,
      });
      expect(qb.andWhere).toHaveBeenCalledWith(
        'chapter.chapterNumber < :currentNumber',
        {
          currentNumber: 2,
        },
      );
      expect(qb.orderBy).toHaveBeenCalledWith('chapter.chapterNumber', 'DESC');
      expect(qb.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(previous);
    });

    it('should throw NotFoundException when current chapter is missing', async () => {
      chapterRepository.findOne.mockResolvedValue(null);

      await expect(service.previousChapter(1, 404)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.previousChapter(1, 404)).rejects.toThrow(
        'Chapter with id 404 not found in story 1',
      );
      expect(chapterRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should return null when current chapter is the first chapter', async () => {
      const current = { id: 1, storyId: 1, chapterNumber: 1 } as Chapter;

      chapterRepository.findOne.mockResolvedValue(current);
      const qb = makeQueryBuilder(null);
      chapterRepository.createQueryBuilder.mockReturnValue(qb);

      const result = await service.previousChapter(1, 1);

      expect(result).toBeNull();
    });
  });
});
