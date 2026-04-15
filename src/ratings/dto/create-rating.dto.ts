import { IsInt, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @IsInt()
  @Min(1)
  userId!: number;

  @IsInt()
  @Min(1)
  storyId!: number;
}
