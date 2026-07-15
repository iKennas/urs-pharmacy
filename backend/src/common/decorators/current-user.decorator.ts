import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Permission } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  pharmacyId: string;
  branchId: string | null;
  roleId: string;
  roleName: string;
  permissions: Permission[];
}

/** Pulls the authenticated user (attached by JwtAuthGuard) onto a controller param. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});
