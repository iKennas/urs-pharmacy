import { Module } from '@nestjs/common';
import { MedicationsService } from './medications.service';
import { MedicationsController } from './medications.controller';
import { CategoriesController } from './categories.controller';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  controllers: [MedicationsController, CategoriesController],
  providers: [MedicationsService, AuditLogService],
  exports: [MedicationsService],
})
export class MedicationsModule {}
