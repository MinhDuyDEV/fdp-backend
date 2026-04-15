import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from './entities/story.entity';
import { ActionStoryFactory } from './factories/action-story.factory';
import { DetectiveStoryFactory } from './factories/detective-story.factory';
import { HorrorStoryFactory } from './factories/horror-story.factory';
import { RomanceStoryFactory } from './factories/romance-story.factory';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [TypeOrmModule.forFeature([Story])],
  controllers: [StoriesController],
  providers: [
    StoriesService,
    ActionStoryFactory,
    HorrorStoryFactory,
    RomanceStoryFactory,
    DetectiveStoryFactory,
  ],
  exports: [StoriesService],
})
export class StoriesModule {}
