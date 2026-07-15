import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { BatchesService } from '../batches/batches.service';
import { GovIntegrationService } from '../gov-integration/gov-integration.service';
import { AuditLogService } from '../../common/audit-log.service';
import { buildZatcaQrPayload } from '../gov-integration/zatca-qr.util';
import { CreateSaleDto, CreateSaleReturnDto } from './dto/sales.dto';
import { GovIntegrationType, MovementType, SalesInvoiceStatus } from '@prisma/client';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Permission } from '@prisma/client';
import { Prisma } from '@prisma/client';

interface ResolvedLine {
  medicationId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxAmount: number;
  lineTotal: number;
}

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly batches: BatchesService,
    private readonly govIntegration: GovIntegrationService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(pharmacyId: string, filters: { branchId?: string; cashierUserId?: string; from?: string; to?: string }) {
    return this.prisma.salesInvoice.findMany({
      where: {
        pharmacyId,
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        ...(filters.cashierUserId ? { cashierUserId: filters.cashierUserId } : {}),
        ...(filters.from || filters.to
          ? { createdAt: { gte: filters.from ? new Date(filters.from) : undefined, lte: filters.to ? new Date(filters.to) : undefined } }
          : {}),
      },
      include: { customer: true, cashierUser: true, branch: true, items: { include: { medication: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(pharmacyId: string, id: string) {
    const invoice = await this.prisma.salesInvoice.findUnique({
      where: { id },
      include: {
        items: { include: { medication: true, batch: true } },
        customer: true,
        cashierUser: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        returns: { select: { id: true, reason: true, isFullReturn: true, createdAt: true } },
      },
    });
    if (!invoice || invoice.pharmacyId !== pharmacyId) throw new NotFoundException('الفاتورة غير موجودة');
    return invoice;
  }

  /**
   * Resolves each cart line to a concrete (batchId, unitPrice, tax) tuple,
   * auto-picking FEFO batches when the caller didn't specify one, and hard-
   * blocking expired stock (PROJECT_MAP.md §5 + §8).
   */
  private async resolveLines(pharmacyId: string, branchId: string, dto: CreateSaleDto, allowOverStock: boolean): Promise<ResolvedLine[]> {
    const lines: ResolvedLine[] = [];

    for (const item of dto.items) {
      const medication = await this.prisma.medication.findUnique({ where: { id: item.medicationId } });
      if (!medication || medication.pharmacyId !== pharmacyId) throw new BadRequestException('صنف غير صالح ضمن الفاتورة');

      let allocations: { batchId: string; quantity: number }[];
      if (item.batchId) {
        const batch = await this.prisma.batch.findUnique({ where: { id: item.batchId } });
        if (!batch || batch.branchId !== branchId) throw new BadRequestException('الدفعة المحددة غير صالحة لهذا الفرع');
        if (batch.expiresAt <= new Date()) {
          throw new BadRequestException(`الدفعة ${batch.batchNumber} منتهية الصلاحية ولا يمكن بيعها`);
        }
        if (batch.quantity < item.quantity && !allowOverStock) {
          throw new BadRequestException(`الكمية المطلوبة من "${medication.name}" أكبر من المتوفر في هذه الدفعة`);
        }
        allocations = [{ batchId: batch.id, quantity: item.quantity }];
      } else if (allowOverStock) {
        // Special-permission path: sell past available stock without a specific batch pick.
        const fefo = await this.batches
          .allocateFefo(branchId, item.medicationId, item.quantity)
          .catch(() => [{ batchId: '', quantity: item.quantity }]);
        allocations = fefo.length ? fefo : [{ batchId: '', quantity: item.quantity }];
      } else {
        allocations = await this.batches.allocateFefo(branchId, item.medicationId, item.quantity);
      }

      const unitPrice = Number(medication.sellPrice);
      const taxRate = Number(medication.taxRate);
      const discountPerUnit = (item.discount ?? 0) / item.quantity;

      for (const alloc of allocations) {
        const grossLine = alloc.quantity * unitPrice;
        const discountShare = discountPerUnit * alloc.quantity;
        const taxable = grossLine - discountShare;
        const taxAmount = taxable * (taxRate / 100);
        lines.push({
          medicationId: item.medicationId,
          batchId: alloc.batchId,
          quantity: alloc.quantity,
          unitPrice,
          discount: discountShare,
          taxAmount,
          lineTotal: taxable + taxAmount,
        });
      }
    }

    return lines;
  }

  /** PROJECT_MAP.md §8 — the POS "إتمام البيع" action. */
  async createSale(pharmacyId: string, user: AuthenticatedUser, dto: CreateSaleDto) {
    if (dto.items.some((i) => (i.discount ?? 0) > 0) && !user.permissions.includes(Permission.DISCOUNT)) {
      throw new ForbiddenException('لا تملك صلاحية تطبيق الخصومات');
    }
    if (dto.allowOverStock && !user.permissions.includes(Permission.ADJUST_STOCK)) {
      throw new ForbiddenException('لا تملك صلاحية البيع بكمية أكبر من المخزون المتاح');
    }

    const lines = await this.resolveLines(pharmacyId, dto.branchId, dto, Boolean(dto.allowOverStock));
    const subtotal = lines.reduce((s, l) => s + (l.quantity * l.unitPrice - l.discount), 0);
    const taxTotal = lines.reduce((s, l) => s + l.taxAmount, 0);
    const total = subtotal + taxTotal;

    const invoiceNumber = await this.nextInvoiceNumber(pharmacyId);
    const pharmacy = await this.prisma.pharmacy.findUniqueOrThrow({ where: { id: pharmacyId } });

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.salesInvoice.create({
        data: {
          pharmacyId,
          branchId: dto.branchId,
          customerId: dto.customerId,
          cashierUserId: user.id,
          invoiceNumber,
          subtotal,
          taxTotal,
          total,
          paymentMethod: dto.paymentMethod,
          status: SalesInvoiceStatus.COMPLETED,
        },
      });

      for (const line of lines) {
        await tx.salesInvoiceItem.create({
          data: {
            salesInvoiceId: created.id,
            medicationId: line.medicationId,
            batchId: line.batchId || null,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount,
            taxAmount: line.taxAmount,
          },
        });

        if (line.batchId) {
          await this.inventory.recordMovement(
            {
              pharmacyId,
              branchId: dto.branchId,
              medicationId: line.medicationId,
              batchId: line.batchId,
              type: MovementType.SALE,
              quantityDelta: -line.quantity,
              referenceType: 'SalesInvoice',
              referenceId: created.id,
              userId: user.id,
            },
            tx as Prisma.TransactionClient,
          );
        }
      }

      const qrPayload = buildZatcaQrPayload({
        sellerName: pharmacy.name,
        vatNumber: pharmacy.taxNumber ?? '',
        timestamp: created.createdAt,
        invoiceTotal: total,
        vatAmount: taxTotal,
      });
      await tx.salesInvoice.update({ where: { id: created.id }, data: { zatcaQrPayload: qrPayload } });

      return created;
    });

    // Outside the DB transaction on purpose — POS completion must never block on this (PROJECT_MAP.md §12).
    await this.govIntegration.enqueue(pharmacyId, invoice.id, GovIntegrationType.ZATCA_SIMPLIFIED, {
      invoiceNumber,
      total,
      taxTotal,
    });

    await this.auditLog.record({
      pharmacyId,
      userId: user.id,
      action: 'SALE_COMPLETED',
      entityType: 'SalesInvoice',
      entityId: invoice.id,
      metadata: { total, invoiceNumber },
    });

    return this.findOne(pharmacyId, invoice.id);
  }

  /** PROJECT_MAP.md §8 "تعليق الفاتورة واستعادتها" — saved as a draft, no stock touched yet. */
  async holdSale(pharmacyId: string, user: AuthenticatedUser, dto: CreateSaleDto) {
    const invoiceNumber = await this.nextInvoiceNumber(pharmacyId, 'H');
    const lines = await this.resolveLines(pharmacyId, dto.branchId, dto, true).catch((): ResolvedLine[] => []);
    const subtotal = lines.reduce((s, l) => s + (l.quantity * l.unitPrice - l.discount), 0);
    const taxTotal = lines.reduce((s, l) => s + l.taxAmount, 0);

    const invoice = await this.prisma.salesInvoice.create({
      data: {
        pharmacyId,
        branchId: dto.branchId,
        customerId: dto.customerId,
        cashierUserId: user.id,
        invoiceNumber,
        subtotal,
        taxTotal,
        total: subtotal + taxTotal,
        paymentMethod: dto.paymentMethod,
        status: SalesInvoiceStatus.HELD,
        items: {
          create: dto.items.map((i) => ({
            medicationId: i.medicationId,
            batchId: i.batchId,
            quantity: i.quantity,
            unitPrice: 0,
            discount: i.discount ?? 0,
            taxAmount: 0,
          })),
        },
      },
    });

    return invoice;
  }

  /** Turns a HELD invoice back into a normal completed sale. */
  async resumeSale(pharmacyId: string, user: AuthenticatedUser, invoiceId: string) {
    const held = await this.findOne(pharmacyId, invoiceId);
    if (held.status !== SalesInvoiceStatus.HELD) throw new BadRequestException('الفاتورة ليست معلّقة');

    const dto: CreateSaleDto = {
      branchId: held.branchId,
      customerId: held.customerId ?? undefined,
      paymentMethod: held.paymentMethod,
      items: held.items.map((i) => ({ medicationId: i.medicationId, batchId: i.batchId ?? undefined, quantity: i.quantity })),
    };
    await this.prisma.salesInvoice.delete({ where: { id: invoiceId } });
    return this.createSale(pharmacyId, user, dto);
  }

  /** PROJECT_MAP.md §9 "إلغاء الفاتورة بصلاحية خاصة" — restocks everything and marks CANCELLED. */
  async cancelSale(pharmacyId: string, user: AuthenticatedUser, invoiceId: string, reason: string) {
    if (!user.permissions.includes(Permission.DELETE)) {
      throw new ForbiddenException('لا تملك صلاحية إلغاء الفواتير');
    }
    const invoice = await this.findOne(pharmacyId, invoiceId);
    if (invoice.status !== SalesInvoiceStatus.COMPLETED) {
      throw new BadRequestException('لا يمكن إلغاء فاتورة بهذه الحالة');
    }

    await this.prisma.$transaction(async (tx) => {
      for (const item of invoice.items) {
        if (item.batchId) {
          await this.inventory.recordMovement(
            {
              pharmacyId,
              branchId: invoice.branchId,
              medicationId: item.medicationId,
              batchId: item.batchId,
              type: MovementType.RETURN_SALE,
              quantityDelta: item.quantity,
              referenceType: 'SalesInvoiceCancellation',
              referenceId: invoiceId,
              userId: user.id,
            },
            tx as Prisma.TransactionClient,
          );
        }
      }
      await tx.salesInvoice.update({ where: { id: invoiceId }, data: { status: SalesInvoiceStatus.CANCELLED, cancelReason: reason } });
    });

    await this.auditLog.record({
      pharmacyId,
      userId: user.id,
      action: 'SALE_CANCELLED',
      entityType: 'SalesInvoice',
      entityId: invoiceId,
      metadata: { reason },
    });

    return { message: 'تم إلغاء الفاتورة وإعادة الكمية للمخزون' };
  }

  /** PROJECT_MAP.md §9 "تنفيذ مرتجع كامل أو جزئي" + "إعادة الكمية إلى الدفعة الأصلية عند الحاجة". */
  async createReturn(pharmacyId: string, user: AuthenticatedUser, invoiceId: string, dto: CreateSaleReturnDto) {
    if (!user.permissions.includes(Permission.RETURN)) {
      throw new ForbiddenException('لا تملك صلاحية تنفيذ المرتجعات');
    }
    const invoice = await this.findOne(pharmacyId, invoiceId);
    if (invoice.status === SalesInvoiceStatus.CANCELLED) throw new BadRequestException('لا يمكن إرجاع فاتورة ملغاة');

    const alreadyReturned = new Map<string, number>();
    for (const ret of await this.prisma.salesReturnItem.findMany({ where: { salesReturn: { salesInvoiceId: invoiceId } } })) {
      alreadyReturned.set(ret.salesInvoiceItemId, (alreadyReturned.get(ret.salesInvoiceItemId) ?? 0) + ret.quantity);
    }

    return this.prisma.$transaction(async (tx) => {
      const salesReturn = await tx.salesReturn.create({
        data: { salesInvoiceId: invoiceId, reason: dto.reason, createdByUserId: user.id },
      });

      for (const returnItem of dto.items) {
        const originalItem = invoice.items.find((i) => i.id === returnItem.salesInvoiceItemId);
        if (!originalItem) throw new BadRequestException('عنصر الفاتورة غير موجود');

        const alreadyQty = alreadyReturned.get(originalItem.id) ?? 0;
        if (alreadyQty + returnItem.quantity > originalItem.quantity) {
          throw new BadRequestException('كمية المرتجع أكبر من الكمية المباعة');
        }

        await tx.salesReturnItem.create({
          data: {
            salesReturnId: salesReturn.id,
            salesInvoiceItemId: originalItem.id,
            quantity: returnItem.quantity,
            restockedToBatch: returnItem.restockToBatch ?? true,
          },
        });

        if ((returnItem.restockToBatch ?? true) && originalItem.batchId) {
          await this.inventory.recordMovement(
            {
              pharmacyId,
              branchId: invoice.branchId,
              medicationId: originalItem.medicationId,
              batchId: originalItem.batchId,
              type: MovementType.RETURN_SALE,
              quantityDelta: returnItem.quantity,
              referenceType: 'SalesReturn',
              referenceId: salesReturn.id,
              userId: user.id,
            },
            tx as Prisma.TransactionClient,
          );
        }
      }

      const totalReturnedNow = dto.items.reduce((s, i) => s + i.quantity, 0);
      const totalAlreadyReturned = [...alreadyReturned.values()].reduce((s, q) => s + q, 0);
      const totalSold = invoice.items.reduce((s, i) => s + i.quantity, 0);
      const isFullReturn = totalAlreadyReturned + totalReturnedNow >= totalSold;

      await tx.salesReturn.update({ where: { id: salesReturn.id }, data: { isFullReturn } });
      await tx.salesInvoice.update({
        where: { id: invoiceId },
        data: { status: isFullReturn ? SalesInvoiceStatus.FULLY_RETURNED : SalesInvoiceStatus.PARTIALLY_RETURNED },
      });

      await this.auditLog.record({
        pharmacyId,
        userId: user.id,
        action: 'SALE_RETURN_CREATED',
        entityType: 'SalesInvoice',
        entityId: invoiceId,
        metadata: { reason: dto.reason, isFullReturn, items: dto.items },
      });

      return salesReturn;
    });
  }

  private async nextInvoiceNumber(pharmacyId: string, prefix = 'S') {
    const count = await this.prisma.salesInvoice.count({ where: { pharmacyId } });
    return `${prefix}-${String(count + 1).padStart(6, '0')}`;
  }
}
