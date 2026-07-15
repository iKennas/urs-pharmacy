import { IsDateString, IsInt, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class CreateBatchDto {
  @IsString()
  branchId: string;

  @IsString()
  medicationId: string;

  @IsOptional()
  @IsString()
  supplierId?: string;

  @IsString()
  @MinLength(1)
  batchNumber: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsPositive()
  buyPrice: number;

  @IsOptional()
  @IsDateString()
  producedAt?: string;

  @IsDateString()
  expiresAt: string;
}
