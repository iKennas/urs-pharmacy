/**
 * Dev seed — mirrors prototype/src/data/mock.ts so the real backend and the
 * frontend prototype tell the same story while both exist side by side.
 * Run with: npx tsx prisma/seed.ts
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { SaleUnit } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  console.log('Seeding...');

  const existingAdmin = await prisma.systemAdmin.findUnique({
    where: { email: 'admin@urs-platform.sa' },
  });
  if (existingAdmin) {
    console.log('Seed skipped — demo data already present.');
    return;
  }

  const pharmacy = await prisma.pharmacy.create({
    data: {
      name: 'صيدلية الشفاء',
      taxNumber: '300123456700003',
      commercialRegister: '1010101010',
      planName: 'الباقة المتقدمة',
      maxBranches: 5,
      subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
    },
  });

  const [mainBranch, malqaBranch, rawdaBranch, narjisBranch] = await Promise.all([
    prisma.branch.create({ data: { pharmacyId: pharmacy.id, name: 'الفرع الرئيسي - العليا', city: 'الرياض' } }),
    prisma.branch.create({ data: { pharmacyId: pharmacy.id, name: 'فرع الملقا', city: 'الرياض' } }),
    prisma.branch.create({ data: { pharmacyId: pharmacy.id, name: 'فرع الروضة', city: 'جدة' } }),
    prisma.branch.create({ data: { pharmacyId: pharmacy.id, name: 'فرع النرجس', city: 'الرياض', status: 'SUSPENDED' } }),
  ]);

  const roles = await Promise.all(
    [
      { name: 'مدير عام', permissions: ['VIEW', 'CREATE', 'UPDATE', 'DELETE', 'PRINT', 'DISCOUNT', 'RETURN', 'ADJUST_STOCK'] },
      { name: 'مدير فرع', permissions: ['VIEW', 'CREATE', 'UPDATE', 'PRINT', 'DISCOUNT', 'RETURN'] },
      { name: 'كاشير', permissions: ['VIEW', 'CREATE', 'PRINT'] },
      { name: 'موظف مخزون', permissions: ['VIEW', 'ADJUST_STOCK'] },
      { name: 'موظف مشتريات', permissions: ['VIEW', 'CREATE', 'UPDATE'] },
    ].map((r) => prisma.role.create({ data: { pharmacyId: pharmacy.id, name: r.name, permissions: r.permissions as never, isSystem: true } })),
  );
  const [generalManager, branchManager, cashierRole, stockRole, purchasingRole] = roles;

  const passwordHash = await bcrypt.hash('Password123!', 12);
  await Promise.all([
    prisma.user.create({
      data: { pharmacyId: pharmacy.id, name: 'عبدالوعيل الحربي', email: 'a.harbi@urs-pharma.sa', roleId: generalManager.id, passwordHash, status: 'ACTIVE' },
    }),
    prisma.user.create({
      data: { pharmacyId: pharmacy.id, branchId: mainBranch.id, name: 'سارة القحطاني', email: 's.qahtani@urs-pharma.sa', roleId: branchManager.id, passwordHash, status: 'ACTIVE' },
    }),
    prisma.user.create({
      data: { pharmacyId: pharmacy.id, branchId: malqaBranch.id, name: 'محمد العتيبي', email: 'm.otaibi@urs-pharma.sa', roleId: cashierRole.id, passwordHash, status: 'ACTIVE' },
    }),
    prisma.user.create({
      data: { pharmacyId: pharmacy.id, branchId: rawdaBranch.id, name: 'نورة الدوسري', email: 'n.dosari@urs-pharma.sa', roleId: stockRole.id, passwordHash, status: 'SUSPENDED' },
    }),
    prisma.user.create({
      data: { pharmacyId: pharmacy.id, branchId: mainBranch.id, name: 'خالد الغامدي', email: 'k.ghamdi@urs-pharma.sa', roleId: purchasingRole.id, passwordHash, status: 'ACTIVE' },
    }),
  ]);

  const categoryNames = ['مسكنات', 'مضادات حيوية', 'فيتامينات', 'مستحضرات تجميل', 'أدوية أطفال', 'أدوية مزمنة'];
  const categories = await Promise.all(categoryNames.map((name) => prisma.category.create({ data: { pharmacyId: pharmacy.id, name } })));
  const [pain, antibiotics, vitamins, cosmetics, kids] = categories;

  const medications = await Promise.all([
    prisma.medication.create({
      data: { pharmacyId: pharmacy.id, name: 'بنادول اكسترا', scientificName: 'Paracetamol + Caffeine', barcode: '6281033670012', categoryId: pain.id, manufacturer: 'GSK', form: 'أقراص', saleUnit: SaleUnit.BOX, buyPrice: 8.5, sellPrice: 12, minStock: 20 },
    }),
    prisma.medication.create({
      data: { pharmacyId: pharmacy.id, name: 'أوجمنتين 1 جم', scientificName: 'Amoxicillin/Clavulanate', barcode: '6281033670029', categoryId: antibiotics.id, manufacturer: 'GSK', form: 'أقراص', saleUnit: SaleUnit.BOX, buyPrice: 22, sellPrice: 29.5, minStock: 15 },
    }),
    prisma.medication.create({
      data: { pharmacyId: pharmacy.id, name: 'فيتامين د3 1000', scientificName: 'Cholecalciferol', barcode: '6281033670036', categoryId: vitamins.id, manufacturer: 'Sanofi', form: 'كبسول', saleUnit: SaleUnit.BOX, buyPrice: 15, sellPrice: 22, minStock: 10 },
    }),
    prisma.medication.create({
      data: { pharmacyId: pharmacy.id, name: 'كونجستال', scientificName: 'Paracetamol/Phenylephrine', barcode: '6281033670043', categoryId: pain.id, manufacturer: 'SPIMACO', form: 'أقراص', saleUnit: SaleUnit.STRIP, buyPrice: 3.2, sellPrice: 5, minStock: 30 },
    }),
    prisma.medication.create({
      data: { pharmacyId: pharmacy.id, name: 'بيبي جونسون لوشن', barcode: '6281033670050', categoryId: cosmetics.id, manufacturer: 'J&J', form: 'سائل', saleUnit: SaleUnit.BOX, buyPrice: 18, sellPrice: 26, minStock: 12 },
    }),
    prisma.medication.create({
      data: { pharmacyId: pharmacy.id, name: 'زيرتك أطفال', scientificName: 'Cetirizine', barcode: '6281033670067', categoryId: kids.id, manufacturer: 'UCB', form: 'شراب', saleUnit: SaleUnit.BOX, buyPrice: 12, sellPrice: 17.5, minStock: 10 },
    }),
  ]);

  const supplier = await prisma.supplier.create({ data: { pharmacyId: pharmacy.id, name: 'شركة نهدي للتوزيع', phone: '0114567890' } });

  // Opening stock batches for the first medication as a smoke-test example.
  const oneYear = new Date();
  oneYear.setFullYear(oneYear.getFullYear() + 1);
  const batch = await prisma.batch.create({
    data: {
      pharmacyId: pharmacy.id,
      branchId: mainBranch.id,
      medicationId: medications[0].id,
      supplierId: supplier.id,
      batchNumber: 'B-2201',
      quantity: 80,
      buyPrice: 8.5,
      expiresAt: oneYear,
    },
  });
  await prisma.branchStock.create({ data: { branchId: mainBranch.id, medicationId: medications[0].id, quantity: 80 } });
  await prisma.inventoryMovement.create({
    data: {
      pharmacyId: pharmacy.id,
      branchId: mainBranch.id,
      medicationId: medications[0].id,
      batchId: batch.id,
      type: 'PURCHASE',
      quantityDelta: 80,
      referenceType: 'Seed',
    },
  });

  const customer = await prisma.customer.create({ data: { pharmacyId: pharmacy.id, name: 'أحمد بن سالم', phone: '0501112233' } });

  const systemAdminPasswordHash = await bcrypt.hash('AdminPass123!', 12);
  await prisma.systemAdmin.create({
    data: { name: 'مشرف النظام', email: 'admin@urs-platform.sa', passwordHash: systemAdminPasswordHash },
  });
  console.log('System admin: admin@urs-platform.sa / AdminPass123!');

  console.log('Seed complete.');
  console.log('Pharmacy:', pharmacy.name, pharmacy.id);
  console.log('Login (all seeded users): password "Password123!"');
  console.log('Example: a.harbi@urs-pharma.sa / Password123!');
  console.log('Customer seeded:', customer.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
