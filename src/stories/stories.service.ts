import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { CreateStoryDto } from './dto/create-story.dto';
import type { PaginationQueryDto } from './dto/pagination-query.dto';
import { Story, StoryGenre } from './entities/story.entity';
import { ActionStoryFactory } from './factories/action-story.factory';
import { DetectiveStoryFactory } from './factories/detective-story.factory';
import { HorrorStoryFactory } from './factories/horror-story.factory';
import { RomanceStoryFactory } from './factories/romance-story.factory';
import type { StoryFactory } from './factories/story.factory';

@Injectable()
export class StoriesService {
  private readonly factoryMap: Map<StoryGenre, StoryFactory>;

  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @Inject(ActionStoryFactory)
    actionFactory: ActionStoryFactory,
    @Inject(HorrorStoryFactory)
    horrorFactory: HorrorStoryFactory,
    @Inject(RomanceStoryFactory)
    romanceFactory: RomanceStoryFactory,
    @Inject(DetectiveStoryFactory)
    detectiveFactory: DetectiveStoryFactory,
  ) {
    // Factory Pattern: map each genre to its concrete factory
    this.factoryMap = new Map<StoryGenre, StoryFactory>([
      [StoryGenre.Action, actionFactory],
      [StoryGenre.Horror, horrorFactory],
      [StoryGenre.Romance, romanceFactory],
      [StoryGenre.Detective, detectiveFactory],
    ]);
  }

  async create(dto: CreateStoryDto): Promise<Story> {
    const factory = this.factoryMap.get(dto.genre);
    if (!factory) {
      throw new Error(`No factory registered for genre: ${dto.genre}`);
    }
    // Factory Pattern: delegate story construction to the concrete factory
    const story = factory.createStory(dto);
    return this.storyRepository.save(story);
  }

  async findAll(
    genre?: StoryGenre,
    pagination?: PaginationQueryDto,
  ): Promise<
    | Story[]
    | {
        data: Story[];
        meta: {
          totalItems: number;
          itemsPerPage: number;
          totalPages: number;
          currentPage: number;
        };
      }
  > {
    const where = genre ? { genre } : {};

    if (!pagination?.page && !pagination?.limit) {
      return this.storyRepository.find({
        where,
        order: { createdAt: 'DESC' as const, id: 'DESC' as const },
        take: 20,
      });
    }

    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;
    const [stories, totalItems] = await this.storyRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' as const, id: 'DESC' as const },
    });

    return {
      data: stories,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: number): Promise<Story> {
    const story = await this.storyRepository.findOne({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story with id ${id} not found`);
    }
    return story;
  }
}
