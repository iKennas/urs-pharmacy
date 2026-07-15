import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../../common/audit-log.service';

interface CreateExpenseDto {
  branchId?: string;
  type: string;
  amount: number;
  date?: string;
  note?: string;
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  list(pharmacyId: string, branchId?: string) {
    return this.prisma.expense.findMany({
      where: { pharmacyId, ...(branchId ? { branchId } : {}) },
      include: { branch: true, createdByUser: true },
      orderBy: { date: 'desc' },
    });
  }

  /** PROJECT_MAP.md §11 "تسجيل المصروفات حسب النوع والفرع والتاريخ". */
  async create(pharmacyId: string, dto: CreateExpenseDto, userId: string) {
    const expense = await this.prisma.expense.create({
      data: {
        pharmacyId,
        branchId: dto.branchId,
        type: dto.type,
        amount: dto.amount,
        date: dto.date ? new Date(dto.date) : new Date(),
        note: dto.note,
        createdByUserId: userId,
      },
    });
    await this.auditLog.record({ pharmacyId, userId, action: 'EXPENSE_CREATED', entityType: 'Expense', entityId: expense.id, metadata: dto });
    return expense;
  }
}
