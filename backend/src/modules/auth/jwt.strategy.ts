import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';

export interface JwtPayload {
  sub: string;
  pharmacyId: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Re-reads role/permissions from the DB on every request instead of trusting the token
   * payload, so a suspended user or a permission change takes effect immediately
   * (PROJECT_MAP.md §1 "إيقاف حساب المستخدم" and §3 "تحديد صلاحيات").
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('الحساب غير نشط أو غير موجود');
    }

    return {
      id: user.id,
      pharmacyId: user.pharmacyId,
      branchId: user.branchId,
      roleId: user.roleId,
      roleName: user.role.name,
      permissions: user.role.permissions,
    };
  }
}
