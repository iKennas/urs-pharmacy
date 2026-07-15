import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  controllers: [CustomersController],
  providers: [CustomersService, AuditLogService],
  exports: [CustomersService],
})
export class CustomersModule {}
