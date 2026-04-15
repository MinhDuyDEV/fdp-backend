import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../stories/entities/story.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { PaginationQueryDto } from '../stories/dto/pagination-query.dto';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { Chapter } from './entities/chapter.entity';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(dto: CreateChapterDto): Promise<Chapter> {
    // FK existence check: verify story exists before creating chapter
    const story = await this.chapterRepository.manager.findOne(Story, {
      where: { id: dto.storyId },
    });
    if (!story) {
      throw new NotFoundException(`Story with id ${dto.storyId} not found`);
    }

    const chapter = this.chapterRepository.create(dto);
    const saved = await this.chapterRepository.save(chapter);

    // Observer Pattern: notify subscribers after successful chapter creation
    this.notificationsService.notifyChapterUpdate(
      dto.storyId,
      saved.id,
      saved.title,
    );

    return saved;
  }

  async findByStory(
    storyId: number,
    pagination?: PaginationQueryDto,
  ): Promise<{
    data: Chapter[];
    meta: {
      totalItems: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
  }> {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 10;

    const [chapters, totalItems] = await this.chapterRepository.findAndCount({
      where: { storyId },
      order: { chapterNumber: 'ASC' as const },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: chapters,
      meta: {
        totalItems,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: number): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({ where: { id } });
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return chapter;
  }
}
