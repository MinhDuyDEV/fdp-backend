import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { StoryGenre } from '../../stories/entities/story.entity';

export class SeedChapterDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  chapterNumber!: number;
}

export class SeedStoryDto {
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

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SeedChapterDto)
  chapters!: SeedChapterDto[];
}

export class SeedFixtureDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SeedStoryDto)
  stories!: SeedStoryDto[];
}
