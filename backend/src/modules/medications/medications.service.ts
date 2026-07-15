import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMedicationDto, UpdateMedicationDto } from './dto/medication.dto';
import { AuditLogService } from '../../common/audit-log.service';
import { SaleUnit } from '@prisma/client';

const EXCEL_COLUMNS = [
  'الاسم',
  'الاسم العلمي',
  'الباركود',
  'التصنيف',
  'الشركة المصنعة',
  'الشكل',
  'وحدة البيع',
  'سعر الشراء',
  'سعر البيع',
  'الضريبة',
  'الحد الأدنى',
] as const;

@Injectable()
export class MedicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  /** PROJECT_MAP.md §4 "البحث بالاسم أو الباركود". */
  async search(pharmacyId: string, query?: string) {
    return this.prisma.medication.findMany({
      where: {
        pharmacyId,
        ...(query
          ? { OR: [{ name: { contains: query, mode: 'insensitive' } }, { barcode: { contains: query } }] }
          : {}),
      },
      include: { category: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(pharmacyId: string, id: string) {
    const medication = await this.prisma.medication.findUnique({ where: { id }, include: { category: true } });
    if (!medication || medication.pharmacyId !== pharmacyId) throw new NotFoundException('الصنف غير موجود');
    return medication;
  }

  /** PROJECT_MAP.md §4 "منع تكرار الباركود". */
  async create(pharmacyId: string, dto: CreateMedicationDto, userId: string) {
    await this.assertBarcodeUnique(pharmacyId, dto.barcode);
    const medication = await this.prisma.medication.create({
      data: { pharmacyId, ...dto, taxRate: dto.taxRate ?? 15, minStock: dto.minStock ?? 0 },
    });
    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'MEDICATION_CREATED',
      entityType: 'Medication',
      entityId: medication.id,
    });
    return medication;
  }

  async update(pharmacyId: string, id: string, dto: UpdateMedicationDto, userId: string) {
    await this.findOne(pharmacyId, id);
    const medication = await this.prisma.medication.update({ where: { id }, data: dto });
    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'MEDICATION_UPDATED',
      entityType: 'Medication',
      entityId: id,
      metadata: dto,
    });
    return medication;
  }

  private async assertBarcodeUnique(pharmacyId: string, barcode: string, excludeId?: string) {
    const existing = await this.prisma.medication.findUnique({ where: { pharmacyId_barcode: { pharmacyId, barcode } } });
    if (existing && existing.id !== excludeId) {
      throw new BadRequestException(`الباركود "${barcode}" مستخدم بالفعل لصنف آخر`);
    }
  }

  /** PROJECT_MAP.md §4 "استيراد وتصدير الأصناف والمخزون عبر ملفات Excel". */
  async importFromExcel(pharmacyId: string, buffer: Buffer, userId: string) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, string | number>>(sheet, { defval: '' });

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const [index, row] of rows.entries()) {
      const barcode = String(row['الباركود'] ?? '').trim();
      const name = String(row['الاسم'] ?? '').trim();
      if (!barcode || !name) {
        results.errors.push(`الصف ${index + 2}: الاسم والباركود مطلوبان`);
        continue;
      }

      const existing = await this.prisma.medication.findUnique({ where: { pharmacyId_barcode: { pharmacyId, barcode } } });
      if (existing) {
        results.skipped++;
        continue;
      }

      let categoryId: string | undefined;
      const categoryName = String(row['التصنيف'] ?? '').trim();
      if (categoryName) {
        const category = await this.prisma.category.upsert({
          where: { pharmacyId_name: { pharmacyId, name: categoryName } },
          create: { pharmacyId, name: categoryName },
          update: {},
        });
        categoryId = category.id;
      }

      const saleUnitRaw = String(row['وحدة البيع'] ?? '').trim();
      const saleUnit =
        saleUnitRaw === 'شريط' ? SaleUnit.STRIP : saleUnitRaw === 'حبة' ? SaleUnit.PIECE : SaleUnit.BOX;

      await this.prisma.medication.create({
        data: {
          pharmacyId,
          name,
          barcode,
          scientificName: String(row['الاسم العلمي'] ?? '') || null,
          manufacturer: String(row['الشركة المصنعة'] ?? '') || null,
          form: String(row['الشكل'] ?? '') || null,
          categoryId,
          saleUnit,
          buyPrice: Number(row['سعر الشراء'] ?? 0),
          sellPrice: Number(row['سعر البيع'] ?? 0),
          taxRate: Number(row['الضريبة'] ?? 15),
          minStock: Number(row['الحد الأدنى'] ?? 0),
        },
      });
      results.created++;
    }

    await this.auditLog.record({
      pharmacyId,
      userId,
      action: 'MEDICATIONS_IMPORTED',
      metadata: results,
    });

    return results;
  }

  async exportToExcel(pharmacyId: string): Promise<Buffer> {
    const medications = await this.prisma.medication.findMany({ where: { pharmacyId }, include: { category: true } });

    const rows = medications.map((m) => ({
      [EXCEL_COLUMNS[0]]: m.name,
      [EXCEL_COLUMNS[1]]: m.scientificName ?? '',
      [EXCEL_COLUMNS[2]]: m.barcode,
      [EXCEL_COLUMNS[3]]: m.category?.name ?? '',
      [EXCEL_COLUMNS[4]]: m.manufacturer ?? '',
      [EXCEL_COLUMNS[5]]: m.form ?? '',
      [EXCEL_COLUMNS[6]]: m.saleUnit === SaleUnit.STRIP ? 'شريط' : m.saleUnit === SaleUnit.PIECE ? 'حبة' : 'علبة',
      [EXCEL_COLUMNS[7]]: Number(m.buyPrice),
      [EXCEL_COLUMNS[8]]: Number(m.sellPrice),
      [EXCEL_COLUMNS[9]]: Number(m.taxRate),
      [EXCEL_COLUMNS[10]]: m.minStock,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: [...EXCEL_COLUMNS] });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'الأصناف');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
