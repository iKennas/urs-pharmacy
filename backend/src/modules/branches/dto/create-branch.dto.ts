import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBranchDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  city?: string;
}
