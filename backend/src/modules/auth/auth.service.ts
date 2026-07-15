import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '../../common/mailer.service';
import { AuditLogService } from '../../common/audit-log.service';
import { UserStatus } from '@prisma/client';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour, per PROJECT_MAP.md §1 "رابط صالح لمدة محدودة"
const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mailer: MailerService,
    private readonly auditLog: AuditLogService,
  ) {}

  async login(email: string, password: string, ipAddress?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, pharmacy: true, branch: true },
    });

    // Same error for "no such user" and "wrong password" — avoids leaking which emails exist.
    const invalidCredentials = () => new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');

    if (!user || !user.passwordHash) throw invalidCredentials();
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('تم إيقاف هذا الحساب. يرجى التواصل مع مدير النظام');
    }
    if (user.status === UserStatus.INVITED) {
      throw new UnauthorizedException('يجب قبول الدعوة وتعيين كلمة مرور أولاً');
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) throw invalidCredentials();

    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

    await this.auditLog.record({
      pharmacyId: user.pharmacyId,
      userId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
    });

    const accessToken = await this.jwt.signAsync({ sub: user.id, pharmacyId: user.pharmacyId });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        roleName: user.role.name,
        permissions: user.role.permissions,
        branchId: user.branchId,
        branchName: user.branch?.name ?? null,
        pharmacyId: user.pharmacyId,
        pharmacyName: user.pharmacy.name,
      },
    };
  }

  async logout(userId: string, pharmacyId: string, ipAddress?: string) {
    // Stateless JWT — nothing to revoke server-side yet (no refresh-token/session store).
    await this.auditLog.record({ pharmacyId, userId, action: 'AUTH_LOGOUT', ipAddress });
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always return success regardless of whether the email exists, to avoid user enumeration.
    if (!user) return { message: 'إذا كان البريد الإلكتروني مسجلاً، سيصلك رابط استعادة كلمة المرور' };

    const token = randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
    });

    await this.mailer.send(
      user.email,
      'استعادة كلمة المرور — URS Pharmacy',
      `مرحبًا ${user.name},\n\nاستخدم الرمز التالي لاستعادة كلمة المرور خلال ساعة واحدة:\n${token}`,
    );

    return { message: 'إذا كان البريد الإلكتروني مسجلاً، سيصلك رابط استعادة كلمة المرور' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { resetToken: token } });
    if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
      throw new BadRequestException('رابط الاستعادة غير صالح أو منتهي الصلاحية');
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpiresAt: null },
    });

    await this.auditLog.record({
      pharmacyId: user.pharmacyId,
      userId: user.id,
      action: 'AUTH_PASSWORD_RESET',
    });

    return { message: 'تم تحديث كلمة المرور بنجاح' };
  }

  async acceptInvite(token: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { inviteToken: token } });
    if (!user) throw new BadRequestException('رابط الدعوة غير صالح');

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, inviteToken: null, status: UserStatus.ACTIVE },
    });

    await this.auditLog.record({
      pharmacyId: user.pharmacyId,
      userId: user.id,
      action: 'AUTH_INVITE_ACCEPTED',
    });

    return { message: 'تم إنشاء الحساب بنجاح، يمكنك تسجيل الدخول الآن' };
  }
}
