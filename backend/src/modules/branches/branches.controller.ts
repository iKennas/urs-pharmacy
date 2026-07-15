import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.branchesService.list(user.pharmacyId);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBranchDto) {
    return this.branchesService.create(user.pharmacyId, dto, user.id);
  }

  @Patch(':id')
  @RequirePermissions(Permission.UPDATE)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateBranchDto) {
    return this.branchesService.update(user.pharmacyId, id, dto, user.id);
  }
}
