import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { CreateBatchDto } from './dto/batch.dto';
import { CurrentUser, type AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Permission } from '@prisma/client';

@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @RequirePermissions(Permission.VIEW)
  list(@CurrentUser() user: AuthenticatedUser, @Query('branchId') branchId?: string) {
    return this.batchesService.list(user.pharmacyId, branchId);
  }

  @Post()
  @RequirePermissions(Permission.CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBatchDto) {
    return this.batchesService.createBatch(user.pharmacyId, dto, user.id);
  }
}
