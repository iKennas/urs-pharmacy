import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MailerService } from '../../common/mailer.service';
import { AuditLogService } from '../../common/audit-log.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, MailerService, AuditLogService],
  exports: [UsersService],
})
export class UsersModule {}
