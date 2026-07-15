import { Permission } from '@prisma/client';

/** Seeded for every new pharmacy — matches PROJECT_MAP.md §3 role list exactly. */
export const DEFAULT_ROLES: { name: string; permissions: Permission[] }[] = [
  {
    name: 'مدير عام',
    permissions: [
      Permission.VIEW,
      Permission.CREATE,
      Permission.UPDATE,
      Permission.DELETE,
      Permission.PRINT,
      Permission.DISCOUNT,
      Permission.RETURN,
      Permission.ADJUST_STOCK,
    ],
  },
  {
    name: 'مدير فرع',
    permissions: [Permission.VIEW, Permission.CREATE, Permission.UPDATE, Permission.PRINT, Permission.DISCOUNT, Permission.RETURN],
  },
  {
    name: 'كاشير',
    permissions: [Permission.VIEW, Permission.CREATE, Permission.PRINT],
  },
  {
    name: 'موظف مخزون',
    permissions: [Permission.VIEW, Permission.ADJUST_STOCK],
  },
  {
    name: 'موظف مشتريات',
    permissions: [Permission.VIEW, Permission.CREATE, Permission.UPDATE],
  },
];
