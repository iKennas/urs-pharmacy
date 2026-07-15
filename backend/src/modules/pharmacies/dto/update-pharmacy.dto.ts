import { IsOptional, IsString } from 'class-validator';

export class UpdatePharmacyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  commercialRegister?: string;

  @IsOptional()
  @IsString()
  invoiceFooterNote?: string;
}
