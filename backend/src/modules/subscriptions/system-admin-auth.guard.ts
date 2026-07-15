import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

export interface SystemAdminJwtPayload {
  sub: string;
  isSystemAdmin: true;
}

/**
 * Separate from JwtAuthGuard on purpose: a SystemAdmin is not a Pharmacy-scoped
 * User row, so it can't flow through the normal JwtStrategy (PROJECT_MAP.md §13).
 */
@Injectable()
export class SystemAdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const authHeader: string | undefined = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
    if (!token) throw new UnauthorizedException('مطلوب تسجيل الدخول');

    try {
      const payload = await this.jwt.verifyAsync<SystemAdminJwtPayload>(token);
      if (!payload.isSystemAdmin) throw new UnauthorizedException();
      request.systemAdminId = payload.sub;
      return true;
    } catch {
      throw new UnauthorizedException('جلسة غير صالحة');
    }
  }
}
