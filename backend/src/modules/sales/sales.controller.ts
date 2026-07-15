import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CancelSaleDto, CreateSaleDto, CreateSaleReturnDto } from './dto/sales.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query('branchId') branchId?: string,
    @Query('cashierUserId') cashierUserId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.salesService.list(user.pharmacyId, { branchId, cashierUserId, from, to });
  }

  @Get(':id')
  @RequirePermissions(Permission.VIEW)
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.salesService.findOne(user.pharmacyId, id);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.salesService.createSale(user.pharmacyId, user, dto);
  }

  @Post('hold')
  @RequirePermissions(Permission.CREATE)
  hold(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.salesService.holdSale(user.pharmacyId, user, dto);
  }

  @Post(':id/resume')
  @RequirePermissions(Permission.CREATE)
  resume(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.salesService.resumeSale(user.pharmacyId, user, id);
  }

  @Post(':id/cancel')
  @RequirePermissions(Permission.DELETE)
  cancel(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CancelSaleDto) {
    return this.salesService.cancelSale(user.pharmacyId, user, id, dto.reason);
  }

  @Post(':id/returns')
  @RequirePermissions(Permission.RETURN)
  createReturn(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateSaleReturnDto) {
    return this.salesService.createReturn(user.pharmacyId, user, id, dto);
  }
}
