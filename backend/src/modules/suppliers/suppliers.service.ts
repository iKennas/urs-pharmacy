import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/audit-log.service';

interface UpsertSupplierDto {
  name: string;
  phone?: string;
}

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(pharmacyId: string) {
    return this.prisma.supplier.findMany({ where: { pharmacyId }, orderBy: { name: 'asc' } });
  }

  async create(pharmacyId: string, dto: UpsertSupplierDto, userId: string) {
    const supplier = await this.prisma.supplier.create({ data: { pharmacyId, ...dto } });
    await this.auditLog.record({ pharmacyId, userId, action: 'SUPPLIER_CREATED', entityType: 'Supplier', entityId: supplier.id });
    return supplier;
  }

  /** PROJECT_MAP.md §7 "عرض كشف حساب المورد وسجل التعاملات". */
  async statement(pharmacyId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: supplierId } });
    if (!supplier || supplier.pharmacyId !== pharmacyId) throw new NotFoundException('المورد غير موجود');

    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: { pharmacyId, supplierId },
      include: { items: { include: { medication: true } }, returns: true },
      orderBy: { date: 'desc' },
    });

    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
    const totalPaid = invoices.reduce((sum, i) => sum + Number(i.paid), 0);

    return {
      supplier,
      invoices,
      totalInvoiced,
      totalPaid,
      balanceDue: totalInvoiced - totalPaid,
    };
  }
}
