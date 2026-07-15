import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/audit-log.service';

interface CreateCustomerDto {
  name: string;
  phone?: string;
}

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(pharmacyId: string) {
    return this.prisma.customer.findMany({ where: { pharmacyId }, orderBy: { name: 'asc' } });
  }

  async create(pharmacyId: string, dto: CreateCustomerDto, userId: string) {
    const customer = await this.prisma.customer.create({ data: { pharmacyId, ...dto } });
    await this.auditLog.record({ pharmacyId, userId, action: 'CUSTOMER_CREATED', entityType: 'Customer', entityId: customer.id });
    return customer;
  }

  /** PROJECT_MAP.md §10 "استخراج ومشاركة كشف حساب العميل" + "عرض الرصيد المتبقي". */
  async statement(pharmacyId: string, customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.pharmacyId !== pharmacyId) throw new NotFoundException('العميل غير موجود');

    const invoices = await this.prisma.salesInvoice.findMany({
      where: { pharmacyId, customerId },
      include: { items: { include: { medication: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const payments = await this.prisma.customerPayment.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });

    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    return { customer, invoices, payments, totalInvoiced, totalPaid, balanceDue: totalInvoiced - totalPaid };
  }

  /** PROJECT_MAP.md §10 "تسجيل الفواتير الآجلة ودفعات السداد". */
  async recordPayment(pharmacyId: string, customerId: string, amount: number, note: string | undefined, userId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || customer.pharmacyId !== pharmacyId) throw new NotFoundException('العميل غير موجود');

    const payment = await this.prisma.customerPayment.create({ data: { customerId, amount, note } });
    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'CUSTOMER_PAYMENT_RECORDED',
      entityType: 'Customer',
      entityId: customerId,
      metadata: { amount },
    });
    return payment;
  }
}
