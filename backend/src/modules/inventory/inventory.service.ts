import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/audit-log.service';
import { Prisma } from '@prisma/client';
import { MovementType } from '@prisma/client';

export interface RecordMovementParams {
  pharmacyId: string;
  branchId: string;
  medicationId: string;
  batchId?: string | null;
  type: MovementType;
  /** Positive to add stock, negative to remove. */
  quantityDelta: number;
  referenceType?: string;
  referenceId?: string;
  note?: string;
  userId?: string | null;
}

const STALE_DAYS = 90;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Single writer for every stock change in the system (PROJECT_MAP.md §6
   * "تحديث المخزون تلقائيًا بعد البيع والشراء والمرتجعات"). Accepts an optional
   * transaction client so callers (Sales, Purchases, Batches) can compose this
   * with their own writes atomically.
   */
  async recordMovement(params: RecordMovementParams, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    const stock = await client.branchStock.upsert({
      where: { branchId_medicationId: { branchId: params.branchId, medicationId: params.medicationId } },
      create: {
        branchId: params.branchId,
        medicationId: params.medicationId,
        quantity: params.quantityDelta,
      },
      update: { quantity: { increment: params.quantityDelta } },
    });

    if (stock.quantity < 0) {
      throw new BadRequestException('لا يمكن أن يصبح رصيد المخزون سالبًا');
    }

    // Keep the batch's own remaining quantity in sync too — FEFO allocation
    // (BatchesService.allocateFefo) reads Batch.quantity, not just the branch total.
    if (params.batchId) {
      const batch = await client.batch.update({
        where: { id: params.batchId },
        data: { quantity: { increment: params.quantityDelta } },
      });
      if (batch.quantity < 0) {
        throw new BadRequestException('لا يمكن أن تصبح كمية الدفعة سالبة');
      }
    }

    await client.inventoryMovement.create({
      data: {
        pharmacyId: params.pharmacyId,
        branchId: params.branchId,
        medicationId: params.medicationId,
        batchId: params.batchId,
        type: params.type,
        quantityDelta: params.quantityDelta,
        referenceType: params.referenceType,
        referenceId: params.referenceId,
        note: params.note,
        createdByUserId: params.userId ?? undefined,
      },
    });

    return stock;
  }

  /** PROJECT_MAP.md §6 "عرض المخزون الحالي لكل فرع". */
  async listStock(pharmacyId: string, branchId?: string) {
    return this.prisma.branchStock.findMany({
      where: {
        branch: { pharmacyId },
        ...(branchId ? { branchId } : {}),
      },
      include: { medication: { include: { category: true } }, branch: true },
      orderBy: { medication: { name: 'asc' } },
    });
  }

  /** PROJECT_MAP.md §6 "متابعة الأصناف الناقصة ... والراكدة". */
  async lowStock(pharmacyId: string, branchId?: string) {
    const stocks = await this.listStock(pharmacyId, branchId);
    return stocks.filter((s) => s.quantity <= s.medication.minStock);
  }

  async nearExpiry(pharmacyId: string, branchId?: string, withinDays = 90) {
    const cutoff = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
    return this.prisma.batch.findMany({
      where: {
        pharmacyId,
        ...(branchId ? { branchId } : {}),
        quantity: { gt: 0 },
        expiresAt: { lte: cutoff },
      },
      include: { medication: true, branch: true },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async staleItems(pharmacyId: string, branchId?: string) {
    const stocks = await this.listStock(pharmacyId, branchId);
    const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

    const stale: typeof stocks = [];
    for (const s of stocks) {
      if (s.quantity <= 0) continue;
      const recentSale = await this.prisma.inventoryMovement.findFirst({
        where: {
          medicationId: s.medicationId,
          branchId: s.branchId,
          type: MovementType.SALE,
          createdAt: { gte: cutoff },
        },
      });
      if (!recentSale) stale.push(s);
    }
    return stale;
  }

  /** PROJECT_MAP.md §6 "عرض سجل حركة كل صنف". */
  async movementHistory(pharmacyId: string, medicationId: string, branchId?: string) {
    return this.prisma.inventoryMovement.findMany({
      where: { pharmacyId, medicationId, ...(branchId ? { branchId } : {}) },
      include: { batch: true, createdByUser: true, branch: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** PROJECT_MAP.md §6 "تحويل المخزون بين الفروع". */
  async transfer(
    pharmacyId: string,
    params: { fromBranchId: string; toBranchId: string; medicationId: string; batchId?: string; quantity: number },
    userId: string,
  ) {
    if (params.fromBranchId === params.toBranchId) {
      throw new BadRequestException('لا يمكن التحويل إلى نفس الفرع');
    }
    if (params.quantity <= 0) throw new BadRequestException('الكمية يجب أن تكون أكبر من صفر');

    return this.prisma.$transaction(async (tx) => {
      await this.recordMovement(
        {
          pharmacyId,
          branchId: params.fromBranchId,
          medicationId: params.medicationId,
          batchId: params.batchId,
          type: MovementType.TRANSFER_OUT,
          quantityDelta: -params.quantity,
          referenceType: 'BranchTransfer',
          userId,
        },
        tx,
      );
      await this.recordMovement(
        {
          pharmacyId,
          branchId: params.toBranchId,
          medicationId: params.medicationId,
          batchId: params.batchId,
          type: MovementType.TRANSFER_IN,
          quantityDelta: params.quantity,
          referenceType: 'BranchTransfer',
          userId,
        },
        tx,
      );

      await this.auditLog.record({
        pharmacyId,
        userId,
        action: 'INVENTORY_TRANSFER',
        entityType: 'Medication',
        entityId: params.medicationId,
        metadata: params,
      });

      return { message: 'تم تحويل المخزون بنجاح' };
    });
  }

  /** PROJECT_MAP.md §6 "تنفيذ الجرد وتسويات المخزون". */
  async stocktakeAdjustment(
    pharmacyId: string,
    params: { branchId: string; medicationId: string; countedQuantity: number; reason: string },
    userId: string,
  ) {
    const current = await this.prisma.branchStock.findUnique({
      where: { branchId_medicationId: { branchId: params.branchId, medicationId: params.medicationId } },
    });
    const currentQty = current?.quantity ?? 0;
    const delta = params.countedQuantity - currentQty;
    if (delta === 0) return { message: 'لا يوجد فرق يستدعي تسوية' };

    await this.recordMovement({
      pharmacyId,
      branchId: params.branchId,
      medicationId: params.medicationId,
      type: MovementType.STOCKTAKE,
      quantityDelta: delta,
      note: params.reason,
      userId,
    });

    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'INVENTORY_STOCKTAKE',
      entityType: 'Medication',
      entityId: params.medicationId,
      metadata: { ...params, previousQuantity: currentQty, delta },
    });

    return { message: 'تم تسجيل التسوية', previousQuantity: currentQty, newQuantity: params.countedQuantity, delta };
  }
}
