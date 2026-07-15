import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseInvoiceDto, CreatePurchaseReturnDto, RecordPurchasePaymentDto } from './dto/purchase-invoice.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.purchasesService.list(user.pharmacyId, branchId);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePurchaseInvoiceDto) {
    return this.purchasesService.create(user.pharmacyId, dto, user.id);
  }

  @Post(':id/payments')
  @RequirePermissions(Permission.UPDATE)
  recordPayment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: RecordPurchasePaymentDto) {
    return this.purchasesService.recordPayment(user.pharmacyId, id, dto.amount, user.id);
  }

  @Post(':id/returns')
  @RequirePermissions(Permission.RETURN)
  createReturn(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreatePurchaseReturnDto) {
    return this.purchasesService.createReturn(user.pharmacyId, id, dto, user.id);
  }
}
