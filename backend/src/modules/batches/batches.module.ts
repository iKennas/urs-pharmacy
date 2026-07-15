import { Module } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Injectable } from '@nestjs/common';
import { BatchesService } from './batches.service';
import { BatchesController } from './batches.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { AuditLogService } from '../../common/audit-log.service';

@Injectable()
class BatchStatusScheduler {
  constructor(private readonly batchesService: BatchesService) {}

  /** PROJECT_MAP.md §5 "تنبيهات قرب انتهاء الصلاحية" — keeps Batch.status current. */
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    await this.batchesService.refreshStatuses();
  }
}

@Module({
  imports: [InventoryModule],
  controllers: [BatchesController],
  providers: [BatchesService, AuditLogService, BatchStatusScheduler],
  exports: [BatchesService],
})
export class BatchesModule {}
