import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailerService } from '../../common/mailer.service';
import { AuditLogService } from '../../common/audit-log.service';
import { InviteUserDto, UpdateUserDto } from './dto/invite-user.dto';
import { UserStatus } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(pharmacyId: string) {
    return this.prisma.user.findMany({
      where: { pharmacyId },
      include: { role: true, branch: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  /** PROJECT_MAP.md §1 "إضافة الموظفين وإرسال دعوات إنشاء الحساب عبر البريد". */
  async invite(pharmacyId: string, dto: InviteUserDto, invitedByUserId: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new BadRequestException('البريد الإلكتروني مستخدم بالفعل');

    const role = await this.prisma.role.findUnique({ where: { id: dto.roleId } });
    if (!role || role.pharmacyId !== pharmacyId) throw new BadRequestException('الدور المحدد غير صالح');

    const inviteToken = randomBytes(32).toString('hex');
    const user = await this.prisma.user.create({
      data: {
        pharmacyId,
        name: dto.name,
        email: dto.email,
        roleId: dto.roleId,
        branchId: dto.branchId,
        status: UserStatus.INVITED,
        inviteToken,
      },
    });

    await this.mailer.send(
      dto.email,
      'دعوة للانضمام إلى URS Pharmacy',
      `مرحبًا ${dto.name},\n\nتمت دعوتك للانضمام إلى النظام. استخدم الرمز التالي لإنشاء كلمة المرور وتفعيل حسابك:\n${inviteToken}`,
    );

    await this.auditLog.record({
      pharmacyId,
      userId: invitedByUserId,
      action: 'USER_INVITED',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: dto.email, roleId: dto.roleId },
    });

    return user;
  }

  async update(pharmacyId: string, targetUserId: string, dto: UpdateUserDto, actingUserId: string) {
    await this.assertBelongsToPharmacy(pharmacyId, targetUserId);
    const user = await this.prisma.user.update({ where: { id: targetUserId }, data: dto });
    await this.auditLog.record({
      pharmacyId,
      userId: actingUserId,
      action: 'USER_UPDATED',
      entityType: 'User',
      entityId: targetUserId,
      metadata: dto,
    });
    return user;
  }

  /** PROJECT_MAP.md §1 "إيقاف حساب المستخدم أو إعادة تفعيله". */
  async setSuspended(pharmacyId: string, targetUserId: string, suspended: boolean, actingUserId: string) {
    await this.assertBelongsToPharmacy(pharmacyId, targetUserId);
    if (targetUserId === actingUserId) throw new BadRequestException('لا يمكنك إيقاف حسابك الخاص');

    const user = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { status: suspended ? UserStatus.SUSPENDED : UserStatus.ACTIVE },
    });

    await this.auditLog.record({
      pharmacyId,
      userId: actingUserId,
      action: suspended ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      entityType: 'User',
      entityId: targetUserId,
    });

    return user;
  }

  private async assertBelongsToPharmacy(pharmacyId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.pharmacyId !== pharmacyId) throw new NotFoundException('المستخدم غير موجود');
    return user;
  }
}
