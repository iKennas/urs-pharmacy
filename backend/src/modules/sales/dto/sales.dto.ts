import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class SaleItemDto {
  @IsString()
  medicationId: string;

  /** Optional explicit batch — if omitted, FEFO auto-allocation is used (PROJECT_MAP.md §5/§8). */
  @IsOptional()
  @IsString()
  batchId?: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @Min(0)
  discount?: number;
}

export class CreateSaleDto {
  @IsString()
  branchId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  /** Bypasses the "no selling beyond stock" guard — requires Permission.ADJUST_STOCK (PROJECT_MAP.md §8). */
  @IsOptional()
  @IsBoolean()
  allowOverStock?: boolean;
}

export class CancelSaleDto {
  @IsString()
  @MinLength(1)
  reason: string;
}

export class SaleReturnItemDto {
  @IsString()
  salesInvoiceItemId: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsBoolean()
  restockToBatch?: boolean;
}

export class CreateSaleReturnDto {
  @IsString()
  @MinLength(1)
  reason: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SaleReturnItemDto)
  items: SaleReturnItemDto[];
}
