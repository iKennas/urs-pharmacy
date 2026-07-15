export const branches = [
  { id: 1, name: "الفرع الرئيسي - العليا", city: "الرياض", staff: 8, status: "نشط" },
  { id: 2, name: "فرع الملقا", city: "الرياض", staff: 5, status: "نشط" },
  { id: 3, name: "فرع الروضة", city: "جدة", staff: 4, status: "نشط" },
  { id: 4, name: "فرع النرجس", city: "الرياض", staff: 3, status: "متوقف" },
];

export const users = [
  { id: 1, name: "عبدالوعيل الحربي", role: "مدير عام", branch: "كل الفروع", email: "a.harbi@urs-pharma.sa", status: "نشط" },
  { id: 2, name: "سارة القحطاني", role: "مدير فرع", branch: "الفرع الرئيسي - العليا", email: "s.qahtani@urs-pharma.sa", status: "نشط" },
  { id: 3, name: "محمد العتيبي", role: "كاشير", branch: "فرع الملقا", email: "m.otaibi@urs-pharma.sa", status: "نشط" },
  { id: 4, name: "نورة الدوسري", role: "موظف مخزون", branch: "فرع الروضة", email: "n.dosari@urs-pharma.sa", status: "موقوف" },
  { id: 5, name: "خالد الغامدي", role: "موظف مشتريات", branch: "الفرع الرئيسي - العليا", email: "k.ghamdi@urs-pharma.sa", status: "نشط" },
];

export const roles = [
  { id: 1, name: "مدير عام", perms: ["عرض", "إضافة", "تعديل", "حذف", "طباعة", "خصومات", "مرتجعات", "تعديل مخزون"] },
  { id: 2, name: "مدير فرع", perms: ["عرض", "إضافة", "تعديل", "طباعة", "خصومات", "مرتجعات"] },
  { id: 3, name: "كاشير", perms: ["عرض", "إضافة", "طباعة"] },
  { id: 4, name: "موظف مخزون", perms: ["عرض", "تعديل مخزون"] },
  { id: 5, name: "موظف مشتريات", perms: ["عرض", "إضافة", "تعديل"] },
];

export const categories = ["مسكنات", "مضادات حيوية", "فيتامينات", "مستحضرات تجميل", "أدوية أطفال", "أدوية مزمنة"];

export const medications = [
  { id: 1, name: "بنادول اكسترا", scientific: "Paracetamol + Caffeine", barcode: "6281033670012", category: "مسكنات", manufacturer: "GSK", form: "أقراص", unit: "علبة", buy: 8.5, sell: 12, tax: 15, minStock: 20, stock: 145 },
  { id: 2, name: "أوجمنتين 1 جم", scientific: "Amoxicillin/Clavulanate", barcode: "6281033670029", category: "مضادات حيوية", manufacturer: "GSK", form: "أقراص", unit: "علبة", buy: 22, sell: 29.5, tax: 15, minStock: 15, stock: 8 },
  { id: 3, name: "فيتامين د3 1000", scientific: "Cholecalciferol", barcode: "6281033670036", category: "فيتامينات", manufacturer: "Sanofi", form: "كبسول", unit: "علبة", buy: 15, sell: 22, tax: 15, minStock: 10, stock: 60 },
  { id: 4, name: "كونجستال", scientific: "Paracetamol/Phenylephrine", barcode: "6281033670043", category: "مسكنات", manufacturer: "SPIMACO", form: "أقراص", unit: "شريط", buy: 3.2, sell: 5, tax: 15, minStock: 30, stock: 12 },
  { id: 5, name: "بيبي جونسون لوشن", scientific: "-", barcode: "6281033670050", category: "مستحضرات تجميل", manufacturer: "J&J", form: "سائل", unit: "علبة", buy: 18, sell: 26, tax: 15, minStock: 12, stock: 34 },
  { id: 6, name: "زيرتك أطفال", scientific: "Cetirizine", barcode: "6281033670067", category: "أدوية أطفال", manufacturer: "UCB", form: "شراب", unit: "علبة", buy: 12, sell: 17.5, tax: 15, minStock: 10, stock: 5 },
];

export const batches = [
  { id: "B-2201", medication: "بنادول اكسترا", supplier: "شركة نهدي للتوزيع", branch: "الفرع الرئيسي - العليا", qty: 80, buy: 8.5, produced: "2025-01-10", expiry: "2027-01-10", status: "سارية" },
  { id: "B-2202", medication: "أوجمنتين 1 جم", supplier: "شركة تمر للأدوية", branch: "فرع الملقا", qty: 8, buy: 22, produced: "2024-06-01", expiry: "2026-08-15", status: "قرب الانتهاء" },
  { id: "B-2203", medication: "كونجستال", supplier: "الشركة السعودية للصناعات الدوائية", branch: "الفرع الرئيسي - العليا", qty: 12, buy: 3.2, produced: "2024-02-01", expiry: "2026-07-20", status: "قرب الانتهاء" },
  { id: "B-2204", medication: "فيتامين د3 1000", supplier: "شركة نهدي للتوزيع", branch: "فرع الروضة", qty: 60, buy: 15, produced: "2025-03-01", expiry: "2028-03-01", status: "سارية" },
];

export const suppliers = [
  { id: 1, name: "شركة نهدي للتوزيع", phone: "0114567890", balance: 12500, invoices: 34 },
  { id: 2, name: "شركة تمر للأدوية", phone: "0126554321", balance: 5400, invoices: 18 },
  { id: 3, name: "الشركة السعودية للصناعات الدوائية (سبيماكو)", phone: "0116987654", balance: 0, invoices: 22 },
];

export const purchaseInvoices = [
  { id: "PO-1042", supplier: "شركة نهدي للتوزيع", branch: "الفرع الرئيسي - العليا", date: "2026-06-28", total: 8400, paid: 8400, status: "مسددة" },
  { id: "PO-1043", supplier: "شركة تمر للأدوية", branch: "فرع الملقا", date: "2026-06-30", total: 3120, paid: 1500, status: "جزئية" },
  { id: "PO-1044", supplier: "الشركة السعودية للصناعات الدوائية (سبيماكو)", branch: "فرع الروضة", date: "2026-07-01", total: 2760, paid: 0, status: "غير مسددة" },
];

export const customers = [
  { id: 1, name: "أحمد بن سالم", phone: "0501112233", debt: 340, lastPurchase: "2026-06-29" },
  { id: 2, name: "منال الشهري", phone: "0502223344", debt: 0, lastPurchase: "2026-07-01" },
  { id: 3, name: "عبدالله المطيري", phone: "0503334455", debt: 1200, lastPurchase: "2026-06-15" },
];

export const salesInvoices = [
  { id: "S-58231", branch: "الفرع الرئيسي - العليا", cashier: "محمد العتيبي", customer: "زبون نقدي", date: "2026-07-03 10:12", total: 84.5, method: "نقدي", status: "مكتملة" },
  { id: "S-58232", branch: "فرع الملقا", cashier: "محمد العتيبي", customer: "أحمد بن سالم", date: "2026-07-03 10:40", total: 220, method: "آجل", status: "مكتملة" },
  { id: "S-58233", branch: "الفرع الرئيسي - العليا", cashier: "سارة القحطاني", customer: "زبون نقدي", date: "2026-07-03 11:02", total: 45, method: "نقدي", status: "مرتجع جزئي" },
  { id: "S-58234", branch: "فرع الروضة", cashier: "نورة الدوسري", customer: "عبدالله المطيري", date: "2026-07-03 11:20", total: 560, method: "آجل", status: "ملغاة" },
];

export const expenses = [
  { id: 1, type: "إيجار", branch: "الفرع الرئيسي - العليا", amount: 12000, date: "2026-07-01" },
  { id: 2, type: "كهرباء", branch: "فرع الملقا", amount: 850, date: "2026-07-01" },
  { id: 3, type: "رواتب", branch: "كل الفروع", amount: 45000, date: "2026-06-30" },
];

export const govQueue = [
  { id: "ZQ-9001", type: "فاتورة ضريبية (زاتكا)", invoice: "S-58231", status: "مقبولة", time: "10:12" },
  { id: "ZQ-9002", type: "فاتورة ضريبية (زاتكا)", invoice: "S-58232", status: "معلقة", time: "10:40" },
  { id: "ZQ-9003", type: "رصد", invoice: "S-58233", status: "مرفوضة", time: "11:02" },
  { id: "ZQ-9004", type: "فاتورة ضريبية (زاتكا)", invoice: "S-58234", status: "إعادة محاولة", time: "11:20" },
];

export const subscriptionPlans = [
  { id: 1, pharmacy: "صيدلية الشفاء", plan: "الباقة المتقدمة", branches: 4, start: "2026-01-01", end: "2026-12-31", status: "نشط" },
  { id: 2, pharmacy: "صيدلية النور", plan: "الباقة الأساسية", branches: 1, start: "2025-08-01", end: "2026-07-15", status: "قارب على الانتهاء" },
  { id: 3, pharmacy: "صيدلية الحياة", plan: "الباقة الأساسية", branches: 2, start: "2025-05-01", end: "2026-05-01", status: "منتهي" },
];

export const dashboardStats = {
  todaySales: 18420,
  todayInvoices: 142,
  lowStock: 6,
  nearExpiry: 4,
  customerDebt: 1540,
  supplierDue: 17900,
  estimatedProfit: 6120,
};

export const salesTrend = [12, 18, 15, 22, 19, 26, 24, 30, 28, 34, 31, 38];
export const topProducts = [
  { name: "بنادول اكسترا", qty: 320 },
  { name: "فيتامين د3 1000", qty: 210 },
  { name: "زيرتك أطفال", qty: 180 },
  { name: "أوجمنتين 1 جم", qty: 140 },
  { name: "كونجستال", qty: 96 },
];
