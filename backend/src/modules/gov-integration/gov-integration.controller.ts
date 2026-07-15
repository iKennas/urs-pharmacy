import { Controller, Get, Param, Post } from '@nestjs/common';
import { GovIntegrationService } from './gov-integration.service';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('gov-integration')
export class GovIntegrationController {
  constructor(private readonly govIntegrationService: GovIntegrationService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.govIntegrationService.list(user.pharmacyId);
  }

  @Post(':id/retry')
  @RequirePermissions(Permission.UPDATE)
  retry(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.govIntegrationService.retry(user.pharmacyId, id);
  }
}
