import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SalesInvoiceStatus } from '@prisma/client';

const ACTIVE_SALE_STATUSES: SalesInvoiceStatus[] = [
  SalesInvoiceStatus.COMPLETED,
  SalesInvoiceStatus.PARTIALLY_RETURNED,
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** PROJECT_MAP.md §11 "تقارير المبيعات اليومية والشهرية". */
  async salesSummary(pharmacyId: string, from: Date, to: Date) {
    const invoices = await this.prisma.salesInvoice.findMany({
      where: { pharmacyId, status: { in: ACTIVE_SALE_STATUSES }, createdAt: { gte: from, lte: to } },
    });
    return {
      invoiceCount: invoices.length,
      totalSales: invoices.reduce((s, i) => s + Number(i.total), 0),
      totalTax: invoices.reduce((s, i) => s + Number(i.taxTotal), 0),
      cashSales: invoices.filter((i) => i.paymentMethod === 'CASH').reduce((s, i) => s + Number(i.total), 0),
      creditSales: invoices.filter((i) => i.paymentMethod === 'CREDIT').reduce((s, i) => s + Number(i.total), 0),
    };
  }

  /** PROJECT_MAP.md §11 "تقارير الفروع والمستخدمين". */
  async byBranch(pharmacyId: string, from: Date, to: Date) {
    const invoices = await this.prisma.salesInvoice.findMany({
      where: { pharmacyId, status: { in: ACTIVE_SALE_STATUSES }, createdAt: { gte: from, lte: to } },
      include: { branch: true },
    });
    const grouped = new Map<string, { branchName: string; total: number; count: number }>();
    for (const inv of invoices) {
      const key = inv.branchId;
      const entry = grouped.get(key) ?? { branchName: inv.branch.name, total: 0, count: 0 };
      entry.total += Number(inv.total);
      entry.count += 1;
      grouped.set(key, entry);
    }
    return [...grouped.values()];
  }

  async byUser(pharmacyId: string, from: Date, to: Date) {
    const invoices = await this.prisma.salesInvoice.findMany({
      where: { pharmacyId, status: { in: ACTIVE_SALE_STATUSES }, createdAt: { gte: from, lte: to } },
      include: { cashierUser: true },
    });
    const grouped = new Map<string, { userName: string; total: number; count: number }>();
    for (const inv of invoices) {
      const key = inv.cashierUserId;
      const entry = grouped.get(key) ?? { userName: inv.cashierUser.name, total: 0, count: 0 };
      entry.total += Number(inv.total);
      entry.count += 1;
      grouped.set(key, entry);
    }
    return [...grouped.values()];
  }

  /** PROJECT_MAP.md §11 "أفضل المنتجات مبيعًا". */
  async topProducts(pharmacyId: string, from: Date, to: Date, limit = 10) {
    const items = await this.prisma.salesInvoiceItem.findMany({
      where: { salesInvoice: { pharmacyId, status: { in: ACTIVE_SALE_STATUSES }, createdAt: { gte: from, lte: to } } },
      include: { medication: true },
    });
    const grouped = new Map<string, { name: string; qty: number }>();
    for (const item of items) {
      const entry = grouped.get(item.medicationId) ?? { name: item.medication.name, qty: 0 };
      entry.qty += item.quantity;
      grouped.set(item.medicationId, entry);
    }
    return [...grouped.values()].sort((a, b) => b.qty - a.qty).slice(0, limit);
  }

  /** PROJECT_MAP.md §11 "قيمة المخزون". */
  async inventoryValue(pharmacyId: string) {
    const stocks = await this.prisma.branchStock.findMany({
      where: { branch: { pharmacyId } },
      include: { medication: true },
    });
    const atBuyPrice = stocks.reduce((s, x) => s + x.quantity * Number(x.medication.buyPrice), 0);
    const atSellPrice = stocks.reduce((s, x) => s + x.quantity * Number(x.medication.sellPrice), 0);
    return { atBuyPrice, atSellPrice, itemCount: stocks.length };
  }

  /** PROJECT_MAP.md §11 "ديون العملاء ومستحقات الموردين". */
  async debtsAndDues(pharmacyId: string) {
    const [invoices, payments, purchaseInvoices] = await Promise.all([
      this.prisma.salesInvoice.findMany({ where: { pharmacyId, paymentMethod: 'CREDIT', status: { in: ACTIVE_SALE_STATUSES } } }),
      this.prisma.customerPayment.findMany({ where: { customer: { pharmacyId } } }),
      this.prisma.purchaseInvoice.findMany({ where: { pharmacyId } }),
    ]);

    const customerDebt = invoices.reduce((s, i) => s + Number(i.total), 0) - payments.reduce((s, p) => s + Number(p.amount), 0);
    const supplierDue = purchaseInvoices.reduce((s, i) => s + (Number(i.total) - Number(i.paid)), 0);

    return { customerDebt, supplierDue };
  }

  /** PROJECT_MAP.md §11 "تقرير الصندوق اليومي". */
  async dailyCash(pharmacyId: string, date: Date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const invoices = await this.prisma.salesInvoice.findMany({
      where: { pharmacyId, status: { in: ACTIVE_SALE_STATUSES }, createdAt: { gte: start, lte: end } },
    });
    const expenses = await this.prisma.expense.findMany({ where: { pharmacyId, date: { gte: start, lte: end } } });

    const cashIn = invoices.filter((i) => i.paymentMethod === 'CASH').reduce((s, i) => s + Number(i.total), 0);
    const cashOut = expenses.reduce((s, e) => s + Number(e.amount), 0);

    return { date: start, cashIn, cashOut, net: cashIn - cashOut };
  }

  /**
   * PROJECT_MAP.md §11 "تقرير أرباح تقديري" — estimated only, based on data
   * entered in the system; NOT a substitute for official accounting/ZATCA
   * bookkeeping (PROJECT_MAP.md §2.8). Keep this disclaimer wherever the
   * figure is shown in the UI.
   */
  async estimatedProfit(pharmacyId: string, from: Date, to: Date) {
    const items = await this.prisma.salesInvoiceItem.findMany({
      where: { salesInvoice: { pharmacyId, status: { in: ACTIVE_SALE_STATUSES }, createdAt: { gte: from, lte: to } } },
      include: { medication: true },
    });
    const revenue = items.reduce((s, i) => s + (i.quantity * Number(i.unitPrice) - Number(i.discount)), 0);
    const cost = items.reduce((s, i) => s + i.quantity * Number(i.medication.buyPrice), 0);
    const expenses = await this.prisma.expense.findMany({ where: { pharmacyId, date: { gte: from, lte: to } } });
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);

    return {
      revenue,
      costOfGoods: cost,
      grossProfit: revenue - cost,
      expenses: totalExpenses,
      estimatedNetProfit: revenue - cost - totalExpenses,
      disclaimer:
        'هذا تقرير تقديري ويعتمد على البيانات المدخلة داخل النظام، ولا يُعد بديلاً عن التقارير المحاسبية الرسمية.',
    };
  }
}
