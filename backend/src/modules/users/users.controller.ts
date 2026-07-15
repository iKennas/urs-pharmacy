import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { InviteUserDto, UpdateUserDto } from './dto/invite-user.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.list(user.pharmacyId);
  }

  @Post('invite')
  @RequirePermissions(Permission.CREATE)
  invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteUserDto) {
    return this.usersService.invite(user.pharmacyId, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.UPDATE)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.pharmacyId, id, dto, user.id);
  }

  @Patch(':id/suspend')
  @RequirePermissions(Permission.UPDATE)
  suspend(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.setSuspended(user.pharmacyId, id, true, user.id);
  }

  @Patch(':id/reactivate')
  @RequirePermissions(Permission.UPDATE)
  reactivate(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.usersService.setSuspended(user.pharmacyId, id, false, user.id);
  }
}
