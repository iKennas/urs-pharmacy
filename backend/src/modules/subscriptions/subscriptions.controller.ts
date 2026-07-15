import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreatePharmacyDto, RenewSubscriptionDto, SystemAdminLoginDto, UpdateSubscriptionDto } from './dto/subscriptions.dto';
import { Public } from '../../common/decorators/public.decorator';
import { SystemAdminAuthGuard } from './system-admin-auth.guard';

/**
 * Every route here is @Public() with respect to the tenant JwtAuthGuard (it's
 * not a Pharmacy User at all — see PROJECT_MAP.md §13) and instead protected
 * by SystemAdminAuthGuard, applied locally.
 */
@Controller('system-admin')
@Public()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: SystemAdminLoginDto) {
    return this.subscriptionsService.login(dto.email, dto.password);
  }

  @Get('pharmacies')
  @UseGuards(SystemAdminAuthGuard)
  listPharmacies() {
    return this.subscriptionsService.listPharmacies();
  }

  @Post('pharmacies')
  @UseGuards(SystemAdminAuthGuard)
  createPharmacy(@Body() dto: CreatePharmacyDto) {
    return this.subscriptionsService.createPharmacy(dto);
  }

  @Patch('pharmacies/:id/subscription')
  @UseGuards(SystemAdminAuthGuard)
  updateSubscription(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.updateSubscription(id, dto);
  }

  @Post('pharmacies/:id/renew')
  @UseGuards(SystemAdminAuthGuard)
  renew(@Param('id') id: string, @Body() dto: RenewSubscriptionDto) {
    return this.subscriptionsService.renew(id, dto);
  }

  @Post('pharmacies/:id/suspend')
  @UseGuards(SystemAdminAuthGuard)
  suspend(@Param('id') id: string) {
    return this.subscriptionsService.setSuspended(id, true);
  }

  @Post('pharmacies/:id/activate')
  @UseGuards(SystemAdminAuthGuard)
  activate(@Param('id') id: string) {
    return this.subscriptionsService.setSuspended(id, false);
  }
}
