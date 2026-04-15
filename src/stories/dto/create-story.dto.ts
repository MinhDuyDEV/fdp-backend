import { StoryGenre } from '../entities/story.entity';

export class CreateStoryDto {
  title!: string;
  description!: string;
  author!: string;
  genre!: StoryGenre;
  coverImage!: string;
}
