import { CreateStoryDto } from '../dto/create-story.dto';
import { Story } from '../entities/story.entity';

export abstract class StoryFactory {
  abstract createStory(dto: CreateStoryDto): Story;
}
