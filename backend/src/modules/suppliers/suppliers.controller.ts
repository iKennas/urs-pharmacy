import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { SuppliersService } from './suppliers.service';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

class CreateSupplierDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.suppliersService.list(user.pharmacyId);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(user.pharmacyId, dto, user.id);
  }

  @Get(':id/statement')
  @RequirePermissions(Permission.VIEW)
  statement(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.suppliersService.statement(user.pharmacyId, id);
  }
}
