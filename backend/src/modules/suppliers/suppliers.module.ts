import { Module } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  controllers: [SuppliersController],
  providers: [SuppliersService, AuditLogService],
  exports: [SuppliersService],
})
export class SuppliersModule {}
