import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { GovIntegrationStatus, GovIntegrationType } from '@prisma/client';

const MAX_RETRIES = 5;

/**
 * Independent outbox queue for ZATCA + Rasd (PROJECT_MAP.md §12): POS/Sales
 * never talks to these services directly or waits on them — it just enqueues
 * a row here, and this processor drains the queue on its own schedule so a
 * slow/broken government endpoint never blocks a sale.
 *
 * 🔒 No ZATCA/Rasd credentials exist yet (see PROJECT_MAP.md §2.1/§2.2/§12) —
 * `attemptSend()` below is honestly a stub: it checks whether the relevant
 * base-URL/credentials env vars are configured, and if not, leaves the item
 * queued rather than pretending it succeeded. Wire in the real HTTP calls
 * once the client has completed onboarding with each authority.
 */
@Injectable()
export class GovIntegrationService {
  private readonly logger = new Logger(GovIntegrationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async enqueue(pharmacyId: string, salesInvoiceId: string, type: GovIntegrationType, requestPayload: Record<string, unknown>) {
    return this.prisma.govIntegrationLog.create({
      data: { pharmacyId, salesInvoiceId, type, requestPayload: requestPayload as never, status: GovIntegrationStatus.QUEUED },
    });
  }

  list(pharmacyId: string) {
    return this.prisma.govIntegrationLog.findMany({
      where: { pharmacyId },
      include: { salesInvoice: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async retry(pharmacyId: string, logId: string) {
    await this.prisma.govIntegrationLog.updateMany({
      where: { id: logId, pharmacyId },
      data: { status: GovIntegrationStatus.RETRYING },
    });
    return this.processOne(logId);
  }

  /** Drains QUEUED/RETRYING items — scheduled every minute (see GovIntegrationModule). */
  async processQueue() {
    const pending = await this.prisma.govIntegrationLog.findMany({
      where: { status: { in: [GovIntegrationStatus.QUEUED, GovIntegrationStatus.RETRYING] }, retryCount: { lt: MAX_RETRIES } },
      take: 50,
    });
    for (const item of pending) {
      await this.processOne(item.id);
    }
  }

  private async processOne(logId: string) {
    const item = await this.prisma.govIntegrationLog.findUnique({ where: { id: logId } });
    if (!item) return;

    const zatcaConfigured = Boolean(this.config.get('ZATCA_API_BASE_URL'));
    const rasdConfigured = Boolean(this.config.get('RASD_API_BASE_URL'));
    const isConfigured =
      (item.type === GovIntegrationType.RASD && rasdConfigured) ||
      ((item.type === GovIntegrationType.ZATCA_STANDARD || item.type === GovIntegrationType.ZATCA_SIMPLIFIED) && zatcaConfigured);

    if (!isConfigured) {
      this.logger.warn(
        `[GovIntegration] لا توجد بيانات اعتماد مهيّأة لـ ${item.type} — العملية ${item.id} ستبقى في قائمة الانتظار حتى يتم تفعيل الربط الرسمي.`,
      );
      await this.prisma.govIntegrationLog.update({
        where: { id: item.id },
        data: {
          retryCount: { increment: 1 },
          lastAttemptAt: new Date(),
          responsePayload: { note: 'بانتظار بيانات الاعتماد الرسمية من الجهة الحكومية — راجع PROJECT_MAP.md §12' } as never,
        },
      });
      return;
    }

    // TODO(real integration): replace with an actual signed HTTP call to ZATCA/Rasd
    // once credentials, certificates, and the sandbox/production base URL are available.
    this.logger.warn(`[GovIntegration] معالج فعلي غير مطبَّق بعد لـ ${item.type} رغم توفر بيانات الاعتماد.`);
  }
}
