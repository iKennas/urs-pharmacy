import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class InviteUserDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  roleId: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;
}
