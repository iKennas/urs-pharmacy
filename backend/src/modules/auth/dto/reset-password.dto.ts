import { IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'يجب ألا تقل كلمة المرور عن 8 أحرف' })
  newPassword: string;
}

export class AcceptInviteDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: 'يجب ألا تقل كلمة المرور عن 8 أحرف' })
  password: string;
}
