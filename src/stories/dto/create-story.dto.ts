import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { StoryGenre } from '../entities/story.entity';

export class CreateStoryDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  author!: string;

  @IsEnum(StoryGenre)
  genre!: StoryGenre;

  @IsString()
  @IsOptional()
  coverImage?: string;
}
