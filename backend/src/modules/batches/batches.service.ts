import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { AuditLogService } from '../../common/audit-log.service';
import { CreateBatchDto } from './dto/batch.dto';
import { BatchStatus, MovementType } from '@prisma/client';
import { Prisma } from '@prisma/client';

const NEAR_EXPIRY_DAYS = 90;

@Injectable()
export class BatchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventory: InventoryService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(pharmacyId: string, branchId?: string) {
    return this.prisma.batch.findMany({
      where: { pharmacyId, ...(branchId ? { branchId } : {}) },
      include: { medication: true, supplier: true, branch: true },
      orderBy: { expiresAt: 'asc' },
    });
  }

  /**
   * Registers a batch and immediately books the matching stock-in movement
   * (PROJECT_MAP.md §5 "تسجيل رقم التشغيلة ... وربط الدفعة بالمورد والفرع").
   * Reused by PurchasesService so a purchase invoice's line items become real batches.
   */
  async createBatch(
    pharmacyId: string,
    dto: CreateBatchDto,
    userId: string,
    options?: { referenceType?: string; referenceId?: string; skipMovement?: boolean },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    const expiresAt = new Date(dto.expiresAt);
    if (expiresAt.getTime() <= Date.now()) {
      throw new BadRequestException('تاريخ الانتهاء يجب أن يكون في المستقبل');
    }

    const batch = await client.batch.create({
      data: {
        pharmacyId,
        branchId: dto.branchId,
        medicationId: dto.medicationId,
        supplierId: dto.supplierId,
        batchNumber: dto.batchNumber,
        quantity: dto.quantity,
        buyPrice: dto.buyPrice,
        producedAt: dto.producedAt ? new Date(dto.producedAt) : null,
        expiresAt,
        status: this.computeStatus(dto.quantity, expiresAt),
      },
    });

    if (!options?.skipMovement) {
      await this.inventory.recordMovement(
        {
          pharmacyId,
          branchId: dto.branchId,
          medicationId: dto.medicationId,
          batchId: batch.id,
          type: MovementType.PURCHASE,
          quantityDelta: dto.quantity,
          referenceType: options?.referenceType ?? 'Batch',
          referenceId: options?.referenceId ?? batch.id,
          userId,
        },
        client as Prisma.TransactionClient,
      );
    }

    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'BATCH_CREATED',
      entityType: 'Batch',
      entityId: batch.id,
      metadata: { batchNumber: dto.batchNumber, quantity: dto.quantity },
    });

    return batch;
  }

  /**
   * FEFO allocation (PROJECT_MAP.md §5 "اختيار الدفعة الأقرب انتهاءً تلقائيًا عند
   * البيع" + §8 "منع بيع الدفعات المنتهية"). Expired batches are hard-excluded;
   * throws if the branch doesn't have enough non-expired stock across all batches.
   */
  async allocateFefo(branchId: string, medicationId: string, quantityNeeded: number) {
    const batches = await this.prisma.batch.findMany({
      where: {
        branchId,
        medicationId,
        quantity: { gt: 0 },
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: 'asc' },
    });

    const allocations: { batchId: string; quantity: number }[] = [];
    let remaining = quantityNeeded;
    for (const batch of batches) {
      if (remaining <= 0) break;
      const take = Math.min(batch.quantity, remaining);
      allocations.push({ batchId: batch.id, quantity: take });
      remaining -= take;
    }

    if (remaining > 0) {
      throw new BadRequestException('لا توجد كمية كافية غير منتهية الصلاحية من هذا الصنف في هذا الفرع');
    }

    return allocations;
  }

  /** Recomputes near-expiry/expired flags — scheduled hourly (see BatchesModule). */
  async refreshStatuses() {
    const now = new Date();
    const nearExpiryCutoff = new Date(now.getTime() + NEAR_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

    await this.prisma.batch.updateMany({ where: { quantity: 0 }, data: { status: BatchStatus.DEPLETED } });
    await this.prisma.batch.updateMany({
      where: { quantity: { gt: 0 }, expiresAt: { lte: now } },
      data: { status: BatchStatus.EXPIRED },
    });
    await this.prisma.batch.updateMany({
      where: { quantity: { gt: 0 }, expiresAt: { gt: now, lte: nearExpiryCutoff } },
      data: { status: BatchStatus.NEAR_EXPIRY },
    });
    await this.prisma.batch.updateMany({
      where: { quantity: { gt: 0 }, expiresAt: { gt: nearExpiryCutoff } },
      data: { status: BatchStatus.ACTIVE },
    });
  }

  private computeStatus(quantity: number, expiresAt: Date): BatchStatus {
    if (quantity <= 0) return BatchStatus.DEPLETED;
    if (expiresAt.getTime() <= Date.now()) return BatchStatus.EXPIRED;
    if (expiresAt.getTime() <= Date.now() + NEAR_EXPIRY_DAYS * 24 * 60 * 60 * 1000) return BatchStatus.NEAR_EXPIRY;
    return BatchStatus.ACTIVE;
  }
}
