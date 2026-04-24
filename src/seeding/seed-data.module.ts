import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chapter } from '../chapters/entities/chapter.entity';
import { Story } from '../stories/entities/story.entity';
import { SeedDataService } from './seed-data.service';

@Module({
  imports: [TypeOrmModule.forFeature([Story, Chapter])],
  providers: [SeedDataService],
  exports: [SeedDataService],
})
export class SeedDataModule {}
