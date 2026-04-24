/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { NotFoundException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { CreateStoryDto } from './dto/create-story.dto';
import { Story, StoryGenre } from './entities/story.entity';
import { ActionStoryFactory } from './factories/action-story.factory';
import { DetectiveStoryFactory } from './factories/detective-story.factory';
import { HorrorStoryFactory } from './factories/horror-story.factory';
import { RomanceStoryFactory } from './factories/romance-story.factory';
import { StoriesService } from './stories.service';

type StoryRepoMock = Pick<
  Repository<Story>,
  'find' | 'findOne' | 'findAndCount' | 'save'
>;

describe('StoriesService', () => {
  let service: StoriesService;

  let storyRepository: jest.Mocked<StoryRepoMock>;
  let actionFactory: { createStory: jest.Mock<Story, [CreateStoryDto]> };
  let horrorFactory: { createStory: jest.Mock<Story, [CreateStoryDto]> };
  let romanceFactory: { createStory: jest.Mock<Story, [CreateStoryDto]> };
  let detectiveFactory: { createStory: jest.Mock<Story, [CreateStoryDto]> };

  const buildDto = (genre: StoryGenre): CreateStoryDto => ({
    title: 'Story Title',
    description: 'Story Description',
    author: 'Author',
    genre,
    coverImage: 'cover.jpg',
  });

  const buildStory = (genre: StoryGenre, id = 1): Story =>
    ({
      id,
      title: 'Story Title',
      description: 'Story Description',
      author: 'Author',
      genre,
      coverImage: 'cover.jpg',
    }) as Story;

  beforeEach(async () => {
    storyRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      findAndCount: jest.fn(),
      save: jest.fn(),
    };

    actionFactory = { createStory: jest.fn() };
    horrorFactory = { createStory: jest.fn() };
    romanceFactory = { createStory: jest.fn() };
    detectiveFactory = { createStory: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: StoriesService,
          useFactory: (
            repo: StoryRepoMock,
            action: { createStory: jest.Mock<Story, [CreateStoryDto]> },
            horror: { createStory: jest.Mock<Story, [CreateStoryDto]> },
            romance: { createStory: jest.Mock<Story, [CreateStoryDto]> },
            detective: { createStory: jest.Mock<Story, [CreateStoryDto]> },
          ) =>
            new StoriesService(
              repo as Repository<Story>,
              action as ActionStoryFactory,
              horror as HorrorStoryFactory,
              romance as RomanceStoryFactory,
              detective as DetectiveStoryFactory,
            ),
          inject: [
            getRepositoryToken(Story),
            ActionStoryFactory,
            HorrorStoryFactory,
            RomanceStoryFactory,
            DetectiveStoryFactory,
          ],
        },
        {
          provide: getRepositoryToken(Story),
          useValue: storyRepository,
        },
        { provide: ActionStoryFactory, useValue: actionFactory },
        { provide: HorrorStoryFactory, useValue: horrorFactory },
        { provide: RomanceStoryFactory, useValue: romanceFactory },
        { provide: DetectiveStoryFactory, useValue: detectiveFactory },
      ],
    }).compile();

    service = module.get<StoriesService>(StoriesService);
  });

  describe('create', () => {
    it.each([
      {
        genre: StoryGenre.Action,
        factoryName: 'actionFactory',
      },
      {
        genre: StoryGenre.Horror,
        factoryName: 'horrorFactory',
      },
      {
        genre: StoryGenre.Romance,
        factoryName: 'romanceFactory',
      },
      {
        genre: StoryGenre.Detective,
        factoryName: 'detectiveFactory',
      },
    ])(
      'should dispatch to correct factory for $genre and save story',
      async ({ genre, factoryName }) => {
        const dto = buildDto(genre);
        const createdStory = buildStory(genre, 101);
        const savedStory = buildStory(genre, 999);

        const factoryByName = {
          actionFactory,
          horrorFactory,
          romanceFactory,
          detectiveFactory,
        };

        factoryByName[factoryName].createStory.mockReturnValue(createdStory);
        storyRepository.save.mockResolvedValue(savedStory);

        const result = await service.create(dto);

        expect(factoryByName[factoryName].createStory).toHaveBeenCalledWith(
          dto,
        );
        expect(storyRepository.save).toHaveBeenCalledWith(createdStory);
        expect(result).toEqual(savedStory);
      },
    );

    it('should throw when genre has no registered factory', async () => {
      const dto = {
        ...buildDto(StoryGenre.Action),
        genre: 'SciFi' as unknown as StoryGenre,
      };

      await expect(service.create(dto)).rejects.toThrow(
        'No factory registered for genre: SciFi',
      );

      expect(storyRepository.save).not.toHaveBeenCalled();
      expect(actionFactory.createStory).not.toHaveBeenCalled();
      expect(horrorFactory.createStory).not.toHaveBeenCalled();
      expect(romanceFactory.createStory).not.toHaveBeenCalled();
      expect(detectiveFactory.createStory).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return legacy array response when pagination is not requested', async () => {
      const stories = [
        buildStory(StoryGenre.Action, 1),
        buildStory(StoryGenre.Horror, 2),
      ];
      storyRepository.find.mockResolvedValue(stories);

      const result = await service.findAll();

      expect(storyRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC', id: 'DESC' },
        take: 20,
      });
      expect(storyRepository.findAndCount).not.toHaveBeenCalled();
      expect(result).toEqual(stories);
    });

    it('should return paginated stories with genre filter and pagination', async () => {
      const stories = [buildStory(StoryGenre.Romance, 6)];
      storyRepository.findAndCount.mockResolvedValue([stories, 11]);

      const result = await service.findAll(StoryGenre.Romance, {
        page: 2,
        limit: 5,
      });

      expect(storyRepository.findAndCount).toHaveBeenCalledWith({
        where: { genre: StoryGenre.Romance },
        skip: 5,
        take: 5,
        order: { createdAt: 'DESC', id: 'DESC' },
      });
      expect(result).toEqual({
        data: stories,
        meta: {
          totalItems: 11,
          itemsPerPage: 5,
          totalPages: 3,
          currentPage: 2,
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return story when found', async () => {
      const story = buildStory(StoryGenre.Detective, 77);
      storyRepository.findOne.mockResolvedValue(story);

      const result = await service.findOne(77);

      expect(storyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 77 },
      });
      expect(result).toEqual(story);
    });

    it('should throw NotFoundException when story is missing', async () => {
      storyRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(404)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.findOne(404)).rejects.toThrow(
        'Story with id 404 not found',
      );
      expect(storyRepository.findOne).toHaveBeenCalledWith({
        where: { id: 404 },
      });
    });
  });
});
