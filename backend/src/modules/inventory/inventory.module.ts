import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, AuditLogService],
  exports: [InventoryService],
})
export class InventoryModule {}
