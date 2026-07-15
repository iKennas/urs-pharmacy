import { Module } from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { ExpensesController } from './expenses.controller';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  controllers: [ExpensesController],
  providers: [ExpensesService, AuditLogService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
