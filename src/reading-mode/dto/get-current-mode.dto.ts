import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class GetCurrentModeDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  storyId?: number;
}
