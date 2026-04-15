import { Injectable } from '@nestjs/common';
import type { CreateStoryDto } from '../dto/create-story.dto';
import { Story, StoryGenre } from '../entities/story.entity';
import { StoryFactory } from './story.factory';

@Injectable()
export class ActionStoryFactory extends StoryFactory {
  createStory(dto: CreateStoryDto): Story {
    const story = new Story();
    Object.assign(story, dto, { genre: StoryGenre.Action });
    return story;
  }
}
