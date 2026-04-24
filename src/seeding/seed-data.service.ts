import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import type { Repository } from 'typeorm';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Story } from '../stories/entities/story.entity';
import { SeedFixtureDto, type SeedChapterDto } from './dto/seed-story.dto';

export type SeedImportSummary = {
  storiesCreated: number;
  storiesUpdated: number;
  storiesSkipped: number;
  chaptersCreated: number;
  chaptersUpdated: number;
  chaptersSkipped: number;
};

@Injectable()
export class SeedDataService {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
  ) {}

  async importSeedData(seedFixture: unknown): Promise<SeedImportSummary> {
    const fixture = this.validateFixture(seedFixture);
    const summary = this.createEmptySummary();

    for (const seedStory of fixture.stories) {
      const { chapters, ...storyFields } = seedStory;
      let story = await this.storyRepository.findOne({
        where: { title: seedStory.title, author: seedStory.author },
      });

      if (!story) {
        story = await this.storyRepository.save(
          this.storyRepository.create(storyFields),
        );
        summary.storiesCreated += 1;
      } else if (this.applyStoryUpdates(story, seedStory)) {
        story = await this.storyRepository.save(story);
        summary.storiesUpdated += 1;
      } else {
        summary.storiesSkipped += 1;
      }

      for (const seedChapter of chapters) {
        await this.importChapter(story, seedChapter, summary);
      }
    }

    return summary;
  }

  private validateFixture(seedFixture: unknown): SeedFixtureDto {
    if (
      typeof seedFixture !== 'object' ||
      seedFixture === null ||
      Array.isArray(seedFixture)
    ) {
      throw new BadRequestException(
        'Invalid seed fixture: fixture must be an object',
      );
    }

    const fixture = plainToInstance(SeedFixtureDto, seedFixture);
    const errors = validateSync(fixture, {
      forbidNonWhitelisted: true,
      whitelist: true,
    });

    if (errors.length > 0) {
      const details = this.formatValidationErrors(errors);
      throw new BadRequestException(`Invalid seed fixture: ${details}`);
    }

    return fixture;
  }

  private createEmptySummary(): SeedImportSummary {
    return {
      storiesCreated: 0,
      storiesUpdated: 0,
      storiesSkipped: 0,
      chaptersCreated: 0,
      chaptersUpdated: 0,
      chaptersSkipped: 0,
    };
  }

  private applyStoryUpdates(
    story: Story,
    seedStory: Omit<SeedFixtureDto['stories'][number], 'chapters'>,
  ): boolean {
    let changed = false;

    if (story.description !== seedStory.description) {
      story.description = seedStory.description;
      changed = true;
    }

    if (story.genre !== seedStory.genre) {
      story.genre = seedStory.genre;
      changed = true;
    }

    if (
      seedStory.coverImage !== undefined &&
      story.coverImage !== seedStory.coverImage
    ) {
      story.coverImage = seedStory.coverImage;
      changed = true;
    }

    return changed;
  }

  private async importChapter(
    story: Story,
    seedChapter: SeedChapterDto,
    summary: SeedImportSummary,
  ): Promise<void> {
    const chapter = await this.chapterRepository.findOne({
      where: { storyId: story.id, chapterNumber: seedChapter.chapterNumber },
    });

    if (!chapter) {
      await this.chapterRepository.save(
        this.chapterRepository.create({
          title: seedChapter.title,
          content: seedChapter.content,
          chapterNumber: seedChapter.chapterNumber,
          storyId: story.id,
        }),
      );
      summary.chaptersCreated += 1;
      return;
    }

    if (this.applyChapterUpdates(chapter, seedChapter)) {
      await this.chapterRepository.save(chapter);
      summary.chaptersUpdated += 1;
      return;
    }

    summary.chaptersSkipped += 1;
  }

  private applyChapterUpdates(
    chapter: Chapter,
    seedChapter: SeedChapterDto,
  ): boolean {
    let changed = false;

    if (chapter.title !== seedChapter.title) {
      chapter.title = seedChapter.title;
      changed = true;
    }

    if (chapter.content !== seedChapter.content) {
      chapter.content = seedChapter.content;
      changed = true;
    }

    return changed;
  }

  private formatValidationErrors(errors: ValidationError[]): string {
    return errors
      .flatMap((error) => this.flattenValidationError(error))
      .join('; ');
  }

  private flattenValidationError(
    error: ValidationError,
    parentPath = '',
  ): string[] {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    const ownMessages = Object.values(error.constraints ?? {}).map(
      (message) => `${path}: ${message}`,
    );
    const childMessages = (error.children ?? []).flatMap((child) =>
      this.flattenValidationError(child, path),
    );

    return [...ownMessages, ...childMessages];
  }
}
