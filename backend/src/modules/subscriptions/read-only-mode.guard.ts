import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PharmacySubscriptionStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * PROJECT_MAP.md §13 "إيقاف استخدام النظام أو تحويله إلى وضع القراءة فقط عند
 * انتهاء الاشتراك" — blocks writes for pharmacies whose subscription is
 * SUSPENDED or READ_ONLY. Runs after JwtAuthGuard/PermissionsGuard so
 * req.user is already populated; skipped for @Public() routes (login, etc.)
 * since those requests have no req.user yet.
 */
@Injectable()
export class ReadOnlyModeGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser | undefined = request.user;
    if (!user) return true; // public route, or system-admin route with no tenant user
    if (!MUTATING_METHODS.has(request.method)) return true;

    const pharmacy = await this.prisma.pharmacy.findUnique({ where: { id: user.pharmacyId } });
    if (!pharmacy) return true;

    if (pharmacy.subscriptionStatus === PharmacySubscriptionStatus.SUSPENDED) {
      throw new ForbiddenException('تم إيقاف اشتراك الصيدلية. يرجى التواصل مع الدعم لتجديد الاشتراك');
    }
    if (pharmacy.subscriptionStatus === PharmacySubscriptionStatus.READ_ONLY) {
      throw new ForbiddenException('انتهى اشتراك الصيدلية — النظام في وضع القراءة فقط حتى يتم التجديد');
    }
    return true;
  }
}
