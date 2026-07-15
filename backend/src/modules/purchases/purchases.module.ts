import { Module } from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { PurchasesController } from './purchases.controller';
import { BatchesModule } from '../batches/batches.module';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  imports: [BatchesModule],
  controllers: [PurchasesController],
  providers: [PurchasesService, AuditLogService],
  exports: [PurchasesService],
})
export class PurchasesModule {}
