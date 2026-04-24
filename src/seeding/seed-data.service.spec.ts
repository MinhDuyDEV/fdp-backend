import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { DeepPartial, FindOneOptions } from 'typeorm';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Story, StoryGenre } from '../stories/entities/story.entity';
import { SeedDataService } from './seed-data.service';

type MockRepository<T extends object> = {
  findOne: jest.Mock<Promise<T | null>, [FindOneOptions<T>]>;
  create: jest.Mock<T, [DeepPartial<T>]>;
  save: jest.Mock<Promise<T>, [T]>;
};

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  findOne: jest.fn<Promise<T | null>, [FindOneOptions<T>]>(),
  create: jest.fn<T, [DeepPartial<T>]>(),
  save: jest.fn<Promise<T>, [T]>(),
});

type SeedFixtureInput = {
  stories: Array<{
    title: string;
    description: string;
    author: string;
    genre: StoryGenre;
    coverImage?: string;
    chapters: Array<{
      title: string;
      content: string;
      chapterNumber: number;
    }>;
  }>;
};

const buildStory = (overrides: Partial<Story> = {}): Story =>
  ({
    id: 10,
    title: 'Iron Tempest',
    description: 'A sky rebellion story.',
    author: 'Mika Arata',
    genre: StoryGenre.Action,
    coverImage: '/covers/iron-tempest.jpg',
    chapters: [],
    comments: [],
    ratings: [],
    readingProgress: [],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as Story;

const buildChapter = (overrides: Partial<Chapter> = {}): Chapter =>
  ({
    id: 20,
    title: 'The Storm Gate',
    content: 'Rin races through the lower docks.',
    chapterNumber: 1,
    storyId: 10,
    story: buildStory(),
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  }) as Chapter;

const buildFixture = (
  overrides: Partial<SeedFixtureInput['stories'][number]> = {},
): SeedFixtureInput => ({
  stories: [
    {
      title: 'Iron Tempest',
      description: 'A sky rebellion story.',
      author: 'Mika Arata',
      genre: StoryGenre.Action,
      coverImage: '/covers/iron-tempest.jpg',
      chapters: [
        {
          chapterNumber: 1,
          title: 'The Storm Gate',
          content: 'Rin races through the lower docks.',
        },
      ],
      ...overrides,
    },
  ],
});

describe('SeedDataService', () => {
  let service: SeedDataService;
  let storyRepository: MockRepository<Story>;
  let chapterRepository: MockRepository<Chapter>;

  beforeEach(async () => {
    storyRepository = createMockRepository<Story>();
    chapterRepository = createMockRepository<Chapter>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeedDataService,
        {
          provide: getRepositoryToken(Story),
          useValue: storyRepository,
        },
        {
          provide: getRepositoryToken(Chapter),
          useValue: chapterRepository,
        },
      ],
    }).compile();

    service = module.get<SeedDataService>(SeedDataService);
  });

  it('rejects invalid fixtures before repository writes', async () => {
    await expect(service.importSeedData({ stories: [] })).rejects.toThrow(
      BadRequestException,
    );

    expect(storyRepository.findOne).not.toHaveBeenCalled();
    expect(storyRepository.create).not.toHaveBeenCalled();
    expect(storyRepository.save).not.toHaveBeenCalled();
    expect(chapterRepository.findOne).not.toHaveBeenCalled();
    expect(chapterRepository.create).not.toHaveBeenCalled();
    expect(chapterRepository.save).not.toHaveBeenCalled();
  });

  it('creates missing stories and chapters from a valid fixture', async () => {
    const createdStory = buildStory();
    const createdChapter = buildChapter();

    storyRepository.findOne.mockResolvedValue(null);
    storyRepository.create.mockReturnValue(createdStory);
    storyRepository.save.mockResolvedValue(createdStory);
    chapterRepository.findOne.mockResolvedValue(null);
    chapterRepository.create.mockReturnValue(createdChapter);
    chapterRepository.save.mockResolvedValue(createdChapter);

    const summary = await service.importSeedData(buildFixture());

    expect(storyRepository.findOne).toHaveBeenCalledWith({
      where: { title: 'Iron Tempest', author: 'Mika Arata' },
    });
    expect(storyRepository.create).toHaveBeenCalledWith({
      title: 'Iron Tempest',
      description: 'A sky rebellion story.',
      author: 'Mika Arata',
      genre: StoryGenre.Action,
      coverImage: '/covers/iron-tempest.jpg',
    });
    expect(chapterRepository.findOne).toHaveBeenCalledWith({
      where: { storyId: createdStory.id, chapterNumber: 1 },
    });
    expect(chapterRepository.create).toHaveBeenCalledWith({
      title: 'The Storm Gate',
      content: 'Rin races through the lower docks.',
      chapterNumber: 1,
      storyId: createdStory.id,
      story: createdStory,
    });
    expect(summary).toEqual({
      storiesCreated: 1,
      storiesUpdated: 0,
      storiesSkipped: 0,
      chaptersCreated: 1,
      chaptersUpdated: 0,
      chaptersSkipped: 0,
    });
  });

  it('skips unchanged existing stories and chapters on rerun', async () => {
    const existingStory = buildStory();
    const existingChapter = buildChapter({ story: existingStory });

    storyRepository.findOne.mockResolvedValue(existingStory);
    chapterRepository.findOne.mockResolvedValue(existingChapter);

    const summary = await service.importSeedData(buildFixture());

    expect(storyRepository.create).not.toHaveBeenCalled();
    expect(storyRepository.save).not.toHaveBeenCalled();
    expect(chapterRepository.create).not.toHaveBeenCalled();
    expect(chapterRepository.save).not.toHaveBeenCalled();
    expect(summary).toEqual({
      storiesCreated: 0,
      storiesUpdated: 0,
      storiesSkipped: 1,
      chaptersCreated: 0,
      chaptersUpdated: 0,
      chaptersSkipped: 1,
    });
  });

  it('updates changed story and chapter fields', async () => {
    const existingStory = buildStory({
      description: 'Old description',
      genre: StoryGenre.Horror,
      coverImage: '/covers/old.jpg',
    });
    const existingChapter = buildChapter({
      story: existingStory,
      title: 'Old title',
      content: 'Old content',
    });

    storyRepository.findOne.mockResolvedValue(existingStory);
    storyRepository.save.mockImplementation((story) => Promise.resolve(story));
    chapterRepository.findOne.mockResolvedValue(existingChapter);
    chapterRepository.save.mockImplementation((chapter) =>
      Promise.resolve(chapter),
    );

    const summary = await service.importSeedData(buildFixture());

    expect(storyRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        description: 'A sky rebellion story.',
        genre: StoryGenre.Action,
        coverImage: '/covers/iron-tempest.jpg',
      }) as Story,
    );
    expect(chapterRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'The Storm Gate',
        content: 'Rin races through the lower docks.',
      }) as Chapter,
    );
    expect(summary).toEqual({
      storiesCreated: 0,
      storiesUpdated: 1,
      storiesSkipped: 0,
      chaptersCreated: 0,
      chaptersUpdated: 1,
      chaptersSkipped: 0,
    });
  });
});
