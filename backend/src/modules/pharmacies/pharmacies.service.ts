import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { AuditLogService } from '../../common/audit-log.service';

@Injectable()
export class PharmaciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async getOwn(pharmacyId: string) {
    const pharmacy = await this.prisma.pharmacy.findUnique({
      where: { id: pharmacyId },
      include: { _count: { select: { branches: true, users: true } } },
    });
    if (!pharmacy) throw new NotFoundException('الصيدلية غير موجودة');
    return pharmacy;
  }

  async updateOwn(pharmacyId: string, dto: UpdatePharmacyDto, userId: string) {
    const pharmacy = await this.prisma.pharmacy.update({ where: { id: pharmacyId }, data: dto });
    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'PHARMACY_SETTINGS_UPDATED',
      entityType: 'Pharmacy',
      entityId: pharmacyId,
      metadata: dto,
    });
    return pharmacy;
  }
}
