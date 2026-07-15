import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { ExpensesService } from './expenses.service';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

class CreateExpenseDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsString()
  @MinLength(1)
  type: string;

  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.expensesService.list(user.pharmacyId, branchId);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.pharmacyId, dto, user.id);
  }
}
