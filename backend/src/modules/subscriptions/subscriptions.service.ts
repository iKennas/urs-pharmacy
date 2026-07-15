import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RolesService } from '../roles/roles.service';
import { MailerService } from '../../common/mailer.service';
import { CreatePharmacyDto, RenewSubscriptionDto, UpdateSubscriptionDto } from './dto/subscriptions.dto';
import { PharmacySubscriptionStatus, UserStatus } from '@prisma/client';

const EXPIRING_SOON_WINDOW_DAYS = 14;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly rolesService: RolesService,
    private readonly mailer: MailerService,
  ) {}

  async login(email: string, password: string) {
    const admin = await this.prisma.systemAdmin.findUnique({ where: { email } });
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new UnauthorizedException('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    }
    const accessToken = await this.jwt.signAsync({ sub: admin.id, isSystemAdmin: true });
    return { accessToken, admin: { id: admin.id, name: admin.name, email: admin.email } };
  }

  /** PROJECT_MAP.md §13 "عرض قائمة الصيدليات وحالة اشتراك كل صيدلية". */
  listPharmacies() {
    return this.prisma.pharmacy.findMany({
      include: { _count: { select: { branches: true, users: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Provisions a brand-new tenant: pharmacy + default roles + first مدير عام invite. */
  async createPharmacy(dto: CreatePharmacyDto) {
    const existingUser = await this.prisma.user.findUnique({ where: { email: dto.ownerEmail } });
    if (existingUser) throw new BadRequestException('البريد الإلكتروني مستخدم بالفعل');

    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + dto.subscriptionMonths);

    const pharmacy = await this.prisma.pharmacy.create({
      data: {
        name: dto.pharmacyName,
        taxNumber: dto.taxNumber,
        commercialRegister: dto.commercialRegister,
        planName: dto.planName,
        maxBranches: dto.maxBranches,
        subscriptionEnd,
        subscriptionStatus: PharmacySubscriptionStatus.ACTIVE,
      },
    });

    await this.prisma.branch.create({ data: { pharmacyId: pharmacy.id, name: 'الفرع الرئيسي' } });
    const roles = await this.rolesService.seedDefaultRoles(pharmacy.id);
    const generalManagerRole = roles.find((r) => r.name === 'مدير عام')!;

    const inviteToken = randomBytes(32).toString('hex');
    const owner = await this.prisma.user.create({
      data: {
        pharmacyId: pharmacy.id,
        name: dto.ownerName,
        email: dto.ownerEmail,
        roleId: generalManagerRole.id,
        status: UserStatus.INVITED,
        inviteToken,
      },
    });

    await this.mailer.send(
      dto.ownerEmail,
      'مرحبًا بك في URS Pharmacy',
      `مرحبًا ${dto.ownerName},\n\nتم إنشاء حساب صيدليتك "${dto.pharmacyName}". استخدم الرمز التالي لتفعيل حسابك كمدير عام:\n${inviteToken}`,
    );

    return { pharmacy, owner };
  }

  async updateSubscription(pharmacyId: string, dto: UpdateSubscriptionDto) {
    return this.prisma.pharmacy.update({ where: { id: pharmacyId }, data: dto });
  }

  /** PROJECT_MAP.md §13 "تجديد الاشتراك من لوحة الإدارة". */
  async renew(pharmacyId: string, dto: RenewSubscriptionDto) {
    const pharmacy = await this.prisma.pharmacy.findUniqueOrThrow({ where: { id: pharmacyId } });
    const base = pharmacy.subscriptionEnd > new Date() ? pharmacy.subscriptionEnd : new Date();
    const newEnd = new Date(base);
    newEnd.setMonth(newEnd.getMonth() + dto.months);

    return this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { subscriptionEnd: newEnd, subscriptionStatus: PharmacySubscriptionStatus.ACTIVE },
    });
  }

  /** PROJECT_MAP.md §13 "تفعيل حساب الصيدلية أو إيقافه عند الحاجة". */
  async setSuspended(pharmacyId: string, suspended: boolean) {
    return this.prisma.pharmacy.update({
      where: { id: pharmacyId },
      data: { subscriptionStatus: suspended ? PharmacySubscriptionStatus.SUSPENDED : PharmacySubscriptionStatus.ACTIVE },
    });
  }

  /**
   * Scheduled daily (see SubscriptionsModule): flips EXPIRING_SOON / READ_ONLY
   * automatically and sends a heads-up email before expiry (PROJECT_MAP.md §13
   * "إرسال تنبيه قبل انتهاء الاشتراك").
   */
  async refreshSubscriptionStatuses() {
    const now = new Date();
    const soonCutoff = new Date(now.getTime() + EXPIRING_SOON_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const expiring = await this.prisma.pharmacy.findMany({
      where: { subscriptionStatus: PharmacySubscriptionStatus.ACTIVE, subscriptionEnd: { lte: soonCutoff, gt: now } },
    });
    for (const pharmacy of expiring) {
      await this.prisma.pharmacy.update({ where: { id: pharmacy.id }, data: { subscriptionStatus: PharmacySubscriptionStatus.EXPIRING_SOON } });
      const owner = await this.prisma.user.findFirst({ where: { pharmacyId: pharmacy.id, role: { name: 'مدير عام' } } });
      if (owner) {
        await this.mailer.send(
          owner.email,
          'تنبيه: اشتراكك على وشك الانتهاء',
          `سينتهي اشتراك "${pharmacy.name}" بتاريخ ${pharmacy.subscriptionEnd.toISOString().slice(0, 10)}. يرجى التجديد لتجنب إيقاف الخدمة.`,
        );
      }
    }

    await this.prisma.pharmacy.updateMany({
      where: {
        subscriptionEnd: { lte: now },
        subscriptionStatus: { notIn: [PharmacySubscriptionStatus.READ_ONLY, PharmacySubscriptionStatus.SUSPENDED] },
      },
      data: { subscriptionStatus: PharmacySubscriptionStatus.READ_ONLY },
    });
  }
}
