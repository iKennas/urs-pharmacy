import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsNumber, IsOptional, IsPositive, IsString, MinLength } from 'class-validator';
import { CustomersService } from './customers.service';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

class RecordPaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsOptional()
  @IsString()
  note?: string;
}

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.customersService.list(user.pharmacyId);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.pharmacyId, dto, user.id);
  }

  @Get(':id/statement')
  @RequirePermissions(Permission.VIEW)
  statement(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.statement(user.pharmacyId, id);
  }

  @Post(':id/payments')
  @RequirePermissions(Permission.CREATE)
  recordPayment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: RecordPaymentDto) {
    return this.customersService.recordPayment(user.pharmacyId, id, dto.amount, dto.note, user.id);
  }
}
