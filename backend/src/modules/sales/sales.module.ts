import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { BatchesModule } from '../batches/batches.module';
import { GovIntegrationModule } from '../gov-integration/gov-integration.module';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  imports: [InventoryModule, BatchesModule, GovIntegrationModule],
  controllers: [SalesController],
  providers: [SalesService, AuditLogService],
  exports: [SalesService],
})
export class SalesModule {}
