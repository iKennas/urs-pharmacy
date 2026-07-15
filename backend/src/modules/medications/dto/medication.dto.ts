import { IsEnum, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { SaleUnit } from '@prisma/client';

export class CreateMedicationDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsString()
  @MinLength(1, { message: 'الباركود مطلوب' })
  barcode: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  form?: string;

  @IsEnum(SaleUnit)
  saleUnit: SaleUnit;

  @IsNumber()
  @Min(0)
  buyPrice: number;

  @IsNumber()
  @Min(0)
  sellPrice: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;
}

export class UpdateMedicationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  scientificName?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  form?: string;

  @IsOptional()
  @IsEnum(SaleUnit)
  saleUnit?: SaleUnit;

  @IsOptional()
  @IsNumber()
  @Min(0)
  buyPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sellPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minStock?: number;
}
