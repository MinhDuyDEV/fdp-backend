import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional } from 'class-validator';

export class SetReadingModeDto {
  @Type(() => Number)
  @IsInt()
  userId: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  storyId?: number;

  @IsIn(['day', 'night', 'scroll', 'horizontal-scroll', 'page-flip'])
  mode: string;
}
