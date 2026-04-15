import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsInt()
  @Min(1)
  userId!: number;

  @IsInt()
  @Min(1)
  storyId!: number;
}
