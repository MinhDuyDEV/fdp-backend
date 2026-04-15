import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
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

  async findByStory(storyId: number): Promise<Chapter[]> {
    return this.chapterRepository.find({
      where: { storyId },
      order: { chapterNumber: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({ where: { id } });
    if (!chapter) {
      throw new NotFoundException(`Chapter with id ${id} not found`);
    }
    return chapter;
  }
}
