import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.rolesService.list(user.pharmacyId);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoleDto) {
    return this.rolesService.create(user.pharmacyId, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.UPDATE)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.updatePermissions(user.pharmacyId, id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.rolesService.remove(user.pharmacyId, id, user.id);
  }
}
