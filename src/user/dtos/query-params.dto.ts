// src/user/dto/query-params.dto.ts
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryParamsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit: number = 10;

  @IsString()
  @IsOptional()
  sortBy: string = 'id'; // default sort column

  @IsString()
  @IsOptional()
  sortOrder: 'asc' | 'desc' = 'asc';

  @IsString()
  @IsOptional()
  search?: string;
}
