import { Injectable, Module } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SystemAdminAuthGuard } from './system-admin-auth.guard';
import { RolesModule } from '../roles/roles.module';
import { MailerService } from '../../common/mailer.service';

@Injectable()
class SubscriptionStatusScheduler {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /** PROJECT_MAP.md §13 — daily sweep for expiring/expired subscriptions. */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleCron() {
    await this.subscriptionsService.refreshSubscriptionStatuses();
  }
}

@Module({
  imports: [
    RolesModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SystemAdminAuthGuard, MailerService, SubscriptionStatusScheduler],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
