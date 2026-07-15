import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'صيغة البريد الإلكتروني غير صحيحة' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'كلمة المرور مطلوبة' })
  password: string;
}
