/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeRequestDto {
  @ApiProperty({
    example: 'project-backend',
    description: 'Unique project identifier',
  })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ example: 'main', description: 'Git branch analyzed' })
  @IsOptional()
  @IsString()
  branch?: string;

  @ApiPropertyOptional({
    example: 'abc123',
    description: 'Git commit SHA analyzed',
  })
  @IsOptional()
  @IsString()
  commit?: string;
}
