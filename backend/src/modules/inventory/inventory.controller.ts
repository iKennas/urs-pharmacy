import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TransferStockDto, StocktakeDto } from './dto/inventory.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.inventoryService.listStock(user.pharmacyId, branchId);
  }

  @Get('low-stock')
  @RequirePermissions(Permission.VIEW)
  lowStock(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.inventoryService.lowStock(user.pharmacyId, branchId);
  }

  @Get('near-expiry')
  @RequirePermissions(Permission.VIEW)
  nearExpiry(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.inventoryService.nearExpiry(user.pharmacyId, branchId);
  }

  @Get('stale')
  @RequirePermissions(Permission.VIEW)
  stale(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.inventoryService.staleItems(user.pharmacyId, branchId);
  }

  @Get('movements/:medicationId')
  @RequirePermissions(Permission.VIEW)
  movements(
    @CurrentUser() user: AuthenticatedUser,
    @Param('medicationId') medicationId: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.inventoryService.movementHistory(user.pharmacyId, medicationId, branchId);
  }

  @Post('transfer')
  @RequirePermissions(Permission.ADJUST_STOCK)
  transfer(@CurrentUser() user: AuthenticatedUser, @Body() dto: TransferStockDto) {
    return this.inventoryService.transfer(user.pharmacyId, dto, user.id);
  }

  @Post('stocktake')
  @RequirePermissions(Permission.ADJUST_STOCK)
  stocktake(@CurrentUser() user: AuthenticatedUser, @Body() dto: StocktakeDto) {
    return this.inventoryService.stocktakeAdjustment(user.pharmacyId, dto, user.id);
  }
}
