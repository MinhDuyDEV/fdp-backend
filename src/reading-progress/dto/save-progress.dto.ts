import { IsIn, IsInt, Min } from 'class-validator';

export class SaveProgressDto {
  @IsInt()
  userId: number;

  @IsInt()
  storyId: number;

  @IsInt()
  chapterId: number;

  @IsInt()
  @Min(0)
  scrollPosition: number;

  @IsIn(['day', 'night', 'scroll', 'page-flip'])
  readingMode: string;
}
