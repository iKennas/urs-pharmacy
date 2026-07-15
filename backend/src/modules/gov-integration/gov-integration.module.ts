import { Injectable, Module } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GovIntegrationService } from './gov-integration.service';
import { GovIntegrationController } from './gov-integration.controller';

@Injectable()
class GovQueueScheduler {
  constructor(private readonly govIntegrationService: GovIntegrationService) {}

  /** PROJECT_MAP.md §12 "إعادة المحاولة عند فشل الاتصال" — drains the outbox every minute. */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    await this.govIntegrationService.processQueue();
  }
}

@Module({
  controllers: [GovIntegrationController],
  providers: [GovIntegrationService, GovQueueScheduler],
  exports: [GovIntegrationService],
})
export class GovIntegrationModule {}
