import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BranchStatus } from '@prisma/client';

export class UpdateBranchDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(BranchStatus)
  status?: BranchStatus;
}
