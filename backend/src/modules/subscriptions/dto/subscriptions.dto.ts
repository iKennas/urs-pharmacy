import { IsEmail, IsInt, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';

export class SystemAdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class CreatePharmacyDto {
  @IsString()
  @MinLength(1)
  pharmacyName: string;

  @IsOptional()
  @IsString()
  taxNumber?: string;

  @IsOptional()
  @IsString()
  commercialRegister?: string;

  @IsString()
  @MinLength(1)
  planName: string;

  @IsInt()
  @IsPositive()
  maxBranches: number;

  @IsInt()
  @IsPositive()
  subscriptionMonths: number;

  @IsString()
  @MinLength(1)
  ownerName: string;

  @IsEmail()
  ownerEmail: string;
}

export class UpdateSubscriptionDto {
  @IsOptional()
  @IsString()
  planName?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  maxBranches?: number;
}

export class RenewSubscriptionDto {
  @IsInt()
  @IsPositive()
  months: number;
}
