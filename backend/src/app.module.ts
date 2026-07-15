import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { PharmaciesModule } from './modules/pharmacies/pharmacies.module';
import { BranchesModule } from './modules/branches/branches.module';
import { RolesModule } from './modules/roles/roles.module';
import { UsersModule } from './modules/users/users.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { BatchesModule } from './modules/batches/batches.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { CustomersModule } from './modules/customers/customers.module';
import { SalesModule } from './modules/sales/sales.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { ReportsModule } from './modules/reports/reports.module';
import { GovIntegrationModule } from './modules/gov-integration/gov-integration.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { ReadOnlyModeGuard } from './modules/subscriptions/read-only-mode.guard';
import { SecurityModule } from './modules/security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    PharmaciesModule,
    BranchesModule,
    RolesModule,
    UsersModule,
    MedicationsModule,
    BatchesModule,
    InventoryModule,
    SuppliersModule,
    PurchasesModule,
    CustomersModule,
    SalesModule,
    ExpensesModule,
    ReportsModule,
    GovIntegrationModule,
    SubscriptionsModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_GUARD, useClass: ReadOnlyModeGuard },
  ],
})
export class AppModule {}
