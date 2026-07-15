const maps: Record<string, Record<string, string>> = {
  branch: { ACTIVE: "نشط", SUSPENDED: "متوقف" },
  user: { ACTIVE: "نشط", SUSPENDED: "موقوف", INVITED: "مدعو" },
  batch: { ACTIVE: "سارية", NEAR_EXPIRY: "قرب الانتهاء", EXPIRED: "منتهية", DEPLETED: "منتهية الكمية" },
  purchase: { UNPAID: "غير مسددة", PARTIAL: "جزئية", PAID: "مسددة" },
  sale: {
    HELD: "معلقة",
    COMPLETED: "مكتملة",
    CANCELLED: "ملغاة",
    PARTIALLY_RETURNED: "مرتجع جزئي",
    FULLY_RETURNED: "مرتجع كامل",
  },
  payment: { CASH: "نقدي", CREDIT: "آجل" },
  unit: { PIECE: "حبة", STRIP: "شريط", BOX: "علبة" },
  govType: {
    ZATCA_STANDARD: "فاتورة ضريبية (زاتكا)",
    ZATCA_SIMPLIFIED: "فاتورة مبسطة (زاتكا)",
    RASD: "رصد",
  },
  govStatus: { QUEUED: "معلقة", ACCEPTED: "مقبولة", REJECTED: "مرفوضة", RETRYING: "إعادة محاولة" },
  subscription: { ACTIVE: "نشط", EXPIRING_SOON: "قارب على الانتهاء", READ_ONLY: "قراءة فقط", SUSPENDED: "منتهي" },
  permission: {
    VIEW: "عرض",
    CREATE: "إضافة",
    UPDATE: "تعديل",
    DELETE: "حذف",
    PRINT: "طباعة",
    DISCOUNT: "خصومات",
    RETURN: "مرتجعات",
    ADJUST_STOCK: "تعديل مخزون",
  },
};

export function label(group: keyof typeof maps, value: string): string {
  return maps[group]?.[value] ?? value;
}

export function money(value: string | number | null | undefined): string {
  const n = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return `${n.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}

export function dateAr(iso: string): string {
  return new Date(iso).toLocaleString("ar-SA", { dateStyle: "short", timeStyle: "short" });
}

export function dateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-SA");
}
