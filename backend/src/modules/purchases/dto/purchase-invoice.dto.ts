import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDateString, IsInt, IsOptional, IsPositive, IsString, MinLength, ValidateNested } from 'class-validator';

export class PurchaseInvoiceItemDto {
  @IsString()
  medicationId: string;

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

export class CreatePurchaseInvoiceDto {
  @IsString()
  branchId: string;

  @IsString()
  supplierId: string;

  @IsString()
  @MinLength(1)
  invoiceNumber: string;

  @IsPositive()
  paid: number;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseInvoiceItemDto)
  items: PurchaseInvoiceItemDto[];
}

export class RecordPurchasePaymentDto {
  @IsPositive()
  amount: number;
}

export class CreatePurchaseReturnDto {
  @IsString()
  @MinLength(1)
  reason: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}
