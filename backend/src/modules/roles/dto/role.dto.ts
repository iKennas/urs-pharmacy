import { ArrayNotEmpty, IsArray, IsEnum, IsString, MinLength } from 'class-validator';
import { Permission } from '@prisma/client';

export class CreateRoleDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}

export class UpdateRoleDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
