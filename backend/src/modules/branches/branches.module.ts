import { Module } from '@nestjs/common';
import { BranchesService } from './branches.service';
import { BranchesController } from './branches.controller';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  controllers: [BranchesController],
  providers: [BranchesService, AuditLogService],
  exports: [BranchesService],
})
export class BranchesModule {}
