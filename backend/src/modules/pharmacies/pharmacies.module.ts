import { Module } from '@nestjs/common';
import { PharmaciesService } from './pharmacies.service';
import { PharmaciesController } from './pharmacies.controller';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  controllers: [PharmaciesController],
  providers: [PharmaciesService, AuditLogService],
  exports: [PharmaciesService],
})
export class PharmaciesModule {}
