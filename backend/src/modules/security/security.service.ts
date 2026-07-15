import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SecurityService {
  constructor(private readonly prisma: PrismaService) {}

  /** PROJECT_MAP.md §14 "تسجيل العمليات الحساسة". */
  auditLogs(pharmacyId: string, take = 200) {
    return this.prisma.auditLog.findMany({
      where: { pharmacyId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  /**
   * PROJECT_MAP.md §14 "إنشاء نسخ احتياطية دورية" — this table is an informational
   * ledger of backups; the actual `pg_dump`/snapshot job is an ops-level script
   * (outside application code) that should INSERT a row here after each run. See
   * PROJECT_MAP.md §14 note for the recommended NCA ECC-aligned backup policy.
   */
  backups(pharmacyId: string) {
    return this.prisma.backupRecord.findMany({
      where: { OR: [{ pharmacyId }, { pharmacyId: null }] },
      orderBy: { createdAt: 'desc' },
    });
  }
}
