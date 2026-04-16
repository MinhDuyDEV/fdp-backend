import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';

export class RenderDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsIn(['day', 'night', 'scroll', 'page-flip'])
  mode?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  storyId?: number;
}
