import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateChapterDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsInt()
  @Min(1)
  chapterNumber!: number;

  @IsInt()
  @Min(1)
  storyId!: number;
}
