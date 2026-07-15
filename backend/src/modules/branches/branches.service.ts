import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { AuditLogService } from '../../common/audit-log.service';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(pharmacyId: string) {
    return this.prisma.branch.findMany({
      where: { pharmacyId },
      include: { _count: { select: { users: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(pharmacyId: string, dto: CreateBranchDto, userId: string) {
    const pharmacy = await this.prisma.pharmacy.findUniqueOrThrow({ where: { id: pharmacyId } });
    const branchCount = await this.prisma.branch.count({ where: { pharmacyId } });

    // PROJECT_MAP.md §2 "إضافة الفروع حسب العدد المسموح به في الباقة"
    if (branchCount >= pharmacy.maxBranches) {
      throw new BadRequestException(
        `تم بلوغ الحد الأقصى لعدد الفروع المسموح به في باقتك الحالية (${pharmacy.maxBranches}). يرجى ترقية الاشتراك لإضافة المزيد.`,
      );
    }

    const branch = await this.prisma.branch.create({ data: { pharmacyId, ...dto } });
    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'BRANCH_CREATED',
      entityType: 'Branch',
      entityId: branch.id,
      metadata: dto,
    });
    return branch;
  }

  async update(pharmacyId: string, branchId: string, dto: UpdateBranchDto, userId: string) {
    await this.assertBelongsToPharmacy(pharmacyId, branchId);
    const branch = await this.prisma.branch.update({ where: { id: branchId }, data: dto });
    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'BRANCH_UPDATED',
      entityType: 'Branch',
      entityId: branchId,
      metadata: dto,
    });
    return branch;
  }

  private async assertBelongsToPharmacy(pharmacyId: string, branchId: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.pharmacyId !== pharmacyId) throw new NotFoundException('الفرع غير موجود');
    return branch;
  }
}
