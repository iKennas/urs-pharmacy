import { Body, Controller, Get, Post } from '@nestjs/common';
import { IsString, MinLength } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

class CreateCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;
}

@Controller('categories')
export class CategoriesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.prisma.category.findMany({ where: { pharmacyId: user.pharmacyId }, orderBy: { name: 'asc' } });
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
    return this.prisma.category.upsert({
      where: { pharmacyId_name: { pharmacyId: user.pharmacyId, name: dto.name } },
      create: { pharmacyId: user.pharmacyId, name: dto.name },
      update: {},
    });
  }
}
