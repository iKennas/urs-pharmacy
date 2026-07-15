import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

function parseRange(from?: string, to?: string) {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { from: start, to: end };
}

@Controller('reports')
@RequirePermissions(Permission.VIEW)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales-summary')
  salesSummary(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string) {
    const range = parseRange(from, to);
    return this.reportsService.salesSummary(user.pharmacyId, range.from, range.to);
  }

  @Get('by-branch')
  byBranch(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string) {
    const range = parseRange(from, to);
    return this.reportsService.byBranch(user.pharmacyId, range.from, range.to);
  }

  @Get('by-user')
  byUser(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string) {
    const range = parseRange(from, to);
    return this.reportsService.byUser(user.pharmacyId, range.from, range.to);
  }

  @Get('top-products')
  topProducts(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string) {
    const range = parseRange(from, to);
    return this.reportsService.topProducts(user.pharmacyId, range.from, range.to);
  }

  @Get('inventory-value')
  inventoryValue(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.inventoryValue(user.pharmacyId);
  }

  @Get('debts-and-dues')
  debtsAndDues(@CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.debtsAndDues(user.pharmacyId);
  }

  @Get('daily-cash')
  dailyCash(@CurrentUser() user: AuthenticatedUser, @Query('date') date?: string) {
    return this.reportsService.dailyCash(user.pharmacyId, date ? new Date(date) : new Date());
  }

  @Get('estimated-profit')
  estimatedProfit(@CurrentUser() user: AuthenticatedUser, @Query('from') from?: string, @Query('to') to?: string) {
    const range = parseRange(from, to);
    return this.reportsService.estimatedProfit(user.pharmacyId, range.from, range.to);
  }
}
