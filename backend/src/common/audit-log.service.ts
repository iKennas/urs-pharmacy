import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface RecordAuditParams {
  pharmacyId: string;
  userId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: object;
  ipAddress?: string;
}

/**
 * Central "سجل العمليات الحساسة" writer (PROJECT_MAP.md §1 + §14). Every module that
 * touches money, stock, permissions, or auth calls this instead of writing ad-hoc logs.
 */
@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async record(params: RecordAuditParams) {
    await this.prisma.auditLog.create({
      data: {
        pharmacyId: params.pharmacyId,
        userId: params.userId ?? null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata as never,
        ipAddress: params.ipAddress,
      },
    });
  }
}
