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

const expectNoRepositoryWrites = (
  storyRepository: MockRepository<Story>,
  chapterRepository: MockRepository<Chapter>,
): void => {
  expect(storyRepository.findOne).not.toHaveBeenCalled();
  expect(storyRepository.create).not.toHaveBeenCalled();
  expect(storyRepository.save).not.toHaveBeenCalled();
  expect(chapterRepository.findOne).not.toHaveBeenCalled();
  expect(chapterRepository.create).not.toHaveBeenCalled();
  expect(chapterRepository.save).not.toHaveBeenCalled();
};

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

  it.each([null, undefined, 'fixture', 42, [], {}, { stories: [] }])(
    'rejects invalid fixture %p before repository writes',
    async (fixture) => {
      await expect(service.importSeedData(fixture)).rejects.toThrow(
        BadRequestException,
      );

      expectNoRepositoryWrites(storyRepository, chapterRepository);
    },
  );

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

  it('preserves an existing cover image when the fixture omits coverImage', async () => {
    const existingStory = buildStory({ coverImage: '/covers/existing.jpg' });
    const existingChapter = buildChapter({ story: existingStory });
    const fixture = buildFixture();
    delete fixture.stories[0].coverImage;

    storyRepository.findOne.mockResolvedValue(existingStory);
    chapterRepository.findOne.mockResolvedValue(existingChapter);

    const summary = await service.importSeedData(fixture);

    expect(storyRepository.save).not.toHaveBeenCalled();
    expect(existingStory.coverImage).toBe('/covers/existing.jpg');
    expect(summary.storiesSkipped).toBe(1);
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

  it('handles mixed existing and missing records across multiple stories and chapters', async () => {
    const existingStory = buildStory({ id: 10 });
    const newStory = buildStory({
      id: 11,
      title: 'Apricot Letters',
      author: 'Eri Momose',
      genre: StoryGenre.Romance,
    });
    const fixture: SeedFixtureInput = {
      stories: [
        {
          ...buildFixture().stories[0],
          chapters: [
            buildFixture().stories[0].chapters[0],
            {
              chapterNumber: 2,
              title: 'Steel Oath',
              content: 'The crew tests Rin in a rail-yard ambush.',
            },
          ],
        },
        {
          title: 'Apricot Letters',
          description: 'Two calligraphy rivals trade anonymous letters.',
          author: 'Eri Momose',
          genre: StoryGenre.Romance,
          coverImage: '/covers/apricot-letters.jpg',
          chapters: [
            {
              chapterNumber: 1,
              title: 'Ink Before Sunrise',
              content: 'Hana finds a critique beneath her brush case.',
            },
          ],
        },
      ],
    };

    storyRepository.findOne
      .mockResolvedValueOnce(existingStory)
      .mockResolvedValueOnce(null);
    storyRepository.create.mockReturnValue(newStory);
    storyRepository.save.mockResolvedValue(newStory);
    chapterRepository.findOne
      .mockResolvedValueOnce(buildChapter({ story: existingStory }))
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    chapterRepository.create.mockImplementation((input) =>
      buildChapter(input as Partial<Chapter>),
    );
    chapterRepository.save.mockImplementation((chapter) =>
      Promise.resolve(chapter),
    );

    const summary = await service.importSeedData(fixture);

    expect(chapterRepository.findOne).toHaveBeenNthCalledWith(2, {
      where: { storyId: existingStory.id, chapterNumber: 2 },
    });
    expect(chapterRepository.findOne).toHaveBeenNthCalledWith(3, {
      where: { storyId: newStory.id, chapterNumber: 1 },
    });
    expect(summary).toEqual({
      storiesCreated: 1,
      storiesUpdated: 0,
      storiesSkipped: 1,
      chaptersCreated: 2,
      chaptersUpdated: 0,
      chaptersSkipped: 1,
    });
  });
});
