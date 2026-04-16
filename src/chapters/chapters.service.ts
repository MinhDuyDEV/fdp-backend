import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import type { PaginationQueryDto } from '../stories/dto/pagination-query.dto';
import { Story } from '../stories/entities/story.entity';
import type { CreateChapterDto } from './dto/create-chapter.dto';
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
  ): Promise<
    | Chapter[]
    | {
        data: Chapter[];
        meta: {
          totalItems: number;
          itemsPerPage: number;
          totalPages: number;
          currentPage: number;
        };
      }
  > {
    if (!pagination?.page && !pagination?.limit) {
      return this.chapterRepository.find({
        where: { storyId },
        order: { chapterNumber: 'ASC' as const },
        take: 20,
      });
    }

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

  async nextChapter(
    storyId: number,
    chapterId: number,
  ): Promise<Chapter | null> {
    // Find the current chapter to get its chapterNumber
    const current = await this.chapterRepository.findOne({
      where: { id: chapterId, storyId },
    });
    if (!current) {
      throw new NotFoundException(
        `Chapter with id ${chapterId} not found in story ${storyId}`,
      );
    }

    // Find the next chapter by chapterNumber ordering
    const next = await this.chapterRepository
      .createQueryBuilder('chapter')
      .where('chapter.storyId = :storyId', { storyId })
      .andWhere('chapter.chapterNumber > :currentNumber', {
        currentNumber: current.chapterNumber,
      })
      .orderBy('chapter.chapterNumber', 'ASC')
      .limit(1)
      .getOne();

    return next ?? null;
  }

  async previousChapter(
    storyId: number,
    chapterId: number,
  ): Promise<Chapter | null> {
    // Find the current chapter to get its chapterNumber
    const current = await this.chapterRepository.findOne({
      where: { id: chapterId, storyId },
    });
    if (!current) {
      throw new NotFoundException(
        `Chapter with id ${chapterId} not found in story ${storyId}`,
      );
    }

    // Find the previous chapter by chapterNumber ordering
    const prev = await this.chapterRepository
      .createQueryBuilder('chapter')
      .where('chapter.storyId = :storyId', { storyId })
      .andWhere('chapter.chapterNumber < :currentNumber', {
        currentNumber: current.chapterNumber,
      })
      .orderBy('chapter.chapterNumber', 'DESC')
      .limit(1)
      .getOne();

    return prev ?? null;
  }
}
