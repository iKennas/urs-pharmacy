import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchesService } from '../batches/batches.service';
import { AuditLogService } from '../../common/audit-log.service';
import { CreatePurchaseInvoiceDto, CreatePurchaseReturnDto } from './dto/purchase-invoice.dto';
import { PurchaseInvoiceStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchesService: BatchesService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(pharmacyId: string, branchId?: string) {
    return this.prisma.purchaseInvoice.findMany({
      where: { pharmacyId, ...(branchId ? { branchId } : {}) },
      include: { supplier: true, branch: true, items: true },
      orderBy: { date: 'desc' },
    });
  }

  /** PROJECT_MAP.md §7 "إضافة فواتير الشراء وربطها بالمورد والدفعات" + "تحديث المخزون تلقائيًا بعد اعتماد الفاتورة". */
  async create(pharmacyId: string, dto: CreatePurchaseInvoiceDto, userId: string) {
    const total = dto.items.reduce((sum, i) => sum + i.quantity * i.buyPrice, 0);
    if (dto.paid > total) throw new BadRequestException('المبلغ المدفوع أكبر من إجمالي الفاتورة');

    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.purchaseInvoice.create({
        data: {
          pharmacyId,
          branchId: dto.branchId,
          supplierId: dto.supplierId,
          invoiceNumber: dto.invoiceNumber,
          total,
          paid: dto.paid,
          status: dto.paid >= total ? PurchaseInvoiceStatus.PAID : dto.paid > 0 ? PurchaseInvoiceStatus.PARTIAL : PurchaseInvoiceStatus.UNPAID,
          createdByUserId: userId,
        },
      });

      for (const item of dto.items) {
        const batch = await this.batchesService.createBatch(
          pharmacyId,
          {
            branchId: dto.branchId,
            medicationId: item.medicationId,
            supplierId: dto.supplierId,
            batchNumber: item.batchNumber,
            quantity: item.quantity,
            buyPrice: item.buyPrice,
            producedAt: item.producedAt,
            expiresAt: item.expiresAt,
          },
          userId,
          { referenceType: 'PurchaseInvoice', referenceId: invoice.id },
          tx as Prisma.TransactionClient,
        );

        await tx.purchaseInvoiceItem.create({
          data: {
            purchaseInvoiceId: invoice.id,
            medicationId: item.medicationId,
            batchId: batch.id,
            quantity: item.quantity,
            buyPrice: item.buyPrice,
          },
        });
      }

      await this.auditLog.record({
        pharmacyId,
        userId,
        action: 'PURCHASE_INVOICE_CREATED',
        entityType: 'PurchaseInvoice',
        entityId: invoice.id,
        metadata: { total, itemCount: dto.items.length },
      });

      return tx.purchaseInvoice.findUnique({ where: { id: invoice.id }, include: { items: true, supplier: true } });
    });
  }

  /** PROJECT_MAP.md §7 "تسجيل المبالغ المدفوعة والمتبقية". */
  async recordPayment(pharmacyId: string, invoiceId: string, amount: number, userId: string) {
    const invoice = await this.assertBelongsToPharmacy(pharmacyId, invoiceId);
    const newPaid = Number(invoice.paid) + amount;
    if (newPaid > Number(invoice.total)) throw new BadRequestException('المبلغ المدفوع يتجاوز إجمالي الفاتورة');

    const updated = await this.prisma.purchaseInvoice.update({
      where: { id: invoiceId },
      data: {
        paid: newPaid,
        status: newPaid >= Number(invoice.total) ? PurchaseInvoiceStatus.PAID : PurchaseInvoiceStatus.PARTIAL,
      },
    });

    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'PURCHASE_PAYMENT_RECORDED',
      entityType: 'PurchaseInvoice',
      entityId: invoiceId,
      metadata: { amount },
    });

    return updated;
  }

  /** PROJECT_MAP.md §7 "تسجيل مرتجعات المشتريات". */
  async createReturn(pharmacyId: string, invoiceId: string, dto: CreatePurchaseReturnDto, userId: string) {
    await this.assertBelongsToPharmacy(pharmacyId, invoiceId);
    const purchaseReturn = await this.prisma.purchaseReturn.create({
      data: { purchaseInvoiceId: invoiceId, reason: dto.reason, quantity: dto.quantity },
    });

    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'PURCHASE_RETURN_CREATED',
      entityType: 'PurchaseInvoice',
      entityId: invoiceId,
      metadata: dto,
    });

    return purchaseReturn;
  }

  private async assertBelongsToPharmacy(pharmacyId: string, invoiceId: string) {
    const invoice = await this.prisma.purchaseInvoice.findUnique({ where: { id: invoiceId } });
    if (!invoice || invoice.pharmacyId !== pharmacyId) throw new NotFoundException('فاتورة الشراء غير موجودة');
    return invoice;
  }
}
