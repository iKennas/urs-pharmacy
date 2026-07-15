import { Controller, Get } from '@nestjs/common';
import { SecurityService } from './security.service';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('security')
@RequirePermissions(Permission.VIEW)
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  @Get('audit-logs')
  auditLogs(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.auditLogs(user.pharmacyId);
  }

  @Get('backups')
  backups(@CurrentUser() user: AuthenticatedUser) {
    return this.securityService.backups(user.pharmacyId);
  }
}
