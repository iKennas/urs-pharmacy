import { Body, Controller, Get, Patch } from '@nestjs/common';
import { PharmaciesService } from './pharmacies.service';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('pharmacies')
export class PharmaciesController {
  constructor(private readonly pharmaciesService: PharmaciesService) {}

  @Get('me')
  getOwn(@CurrentUser() user: AuthenticatedUser) {
    return this.pharmaciesService.getOwn(user.pharmacyId);
  }

  @Patch('me')
  @RequirePermissions(Permission.UPDATE)
  updateOwn(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdatePharmacyDto) {
    return this.pharmaciesService.updateOwn(user.pharmacyId, dto, user.id);
  }
}
