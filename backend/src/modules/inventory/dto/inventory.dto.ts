import { IsInt, IsOptional, IsPositive, IsString, Min } from 'class-validator';

export class TransferStockDto {
  @IsString()
  fromBranchId: string;

  @IsString()
  toBranchId: string;

  @IsString()
  medicationId: string;

  @IsOptional()
  @IsString()
  batchId?: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}

export class StocktakeDto {
  @IsString()
  branchId: string;

  @IsString()
  medicationId: string;

  @IsInt()
  @Min(0)
  countedQuantity: number;

  @IsString()
  reason: string;
}
