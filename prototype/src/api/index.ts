import { apiFetch } from "./client";
import type {
  AdminLoginResponse,
  AuditLog,
  BackupRecord,
  Batch,
  Branch,
  BranchStock,
  Customer,
  CustomerStatement,
  Expense,
  GovLog,
  LoginResponse,
  Medication,
  Permission,
  Pharmacy,
  PurchaseInvoice,
  Role,
  SalesInvoice,
  SalesInvoiceDetail,
  Supplier,
  SupplierStatement,
  User,
} from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  logout: () => apiFetch("/auth/logout", { method: "POST" }),
  forgotPassword: (email: string) =>
    apiFetch<{ message: string }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
};

export const adminApi = {
  login: (email: string, password: string) =>
    apiFetch<AdminLoginResponse>("/system-admin/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  pharmacies: () => apiFetch<Pharmacy[]>("/system-admin/pharmacies"),
  renew: (id: string, months: number) =>
    apiFetch(`/system-admin/pharmacies/${id}/renew`, { method: "POST", body: JSON.stringify({ months }) }),
};

export const pharmacyApi = {
  me: () => apiFetch<Pharmacy>("/pharmacies/me"),
  update: (body: {
    name?: string;
    logoUrl?: string;
    taxNumber?: string;
    commercialRegister?: string;
    invoiceFooterNote?: string;
  }) => apiFetch<Pharmacy>("/pharmacies/me", { method: "PATCH", body: JSON.stringify(body) }),
};

export const branchesApi = {
  list: () => apiFetch<Branch[]>("/branches"),
  create: (body: { name: string; city?: string }) =>
    apiFetch<Branch>("/branches", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; city?: string; status?: string }) =>
    apiFetch<Branch>(`/branches/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

export const usersApi = {
  list: () => apiFetch<User[]>("/users"),
  invite: (body: { name: string; email: string; roleId: string; branchId?: string }) =>
    apiFetch<User>("/users/invite", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { name?: string; roleId?: string; branchId?: string }) =>
    apiFetch<User>(`/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  suspend: (id: string) => apiFetch(`/users/${id}/suspend`, { method: "PATCH" }),
  reactivate: (id: string) => apiFetch(`/users/${id}/reactivate`, { method: "PATCH" }),
};

export const rolesApi = {
  list: () => apiFetch<Role[]>("/roles"),
  create: (body: { name: string; permissions: Permission[] }) =>
    apiFetch<Role>("/roles", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: { permissions: Permission[] }) =>
    apiFetch<Role>(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};

export const medicationsApi = {
  list: (q?: string) => apiFetch<Medication[]>(`/medications${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  get: (id: string) => apiFetch<Medication>(`/medications/${id}`),
  create: (body: {
    name: string;
    scientificName?: string;
    barcode: string;
    categoryId?: string;
    manufacturer?: string;
    form?: string;
    saleUnit: string;
    buyPrice: number;
    sellPrice: number;
    taxRate?: number;
    minStock?: number;
  }) => apiFetch<Medication>("/medications", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: Record<string, unknown>) =>
    apiFetch<Medication>(`/medications/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  categories: () => apiFetch<{ id: string; name: string }[]>("/categories"),
  createCategory: (name: string) =>
    apiFetch<{ id: string; name: string }>("/categories", { method: "POST", body: JSON.stringify({ name }) }),
  exportExcel: async () => {
    const token = localStorage.getItem("urs_token");
    const res = await fetch("/api/medications/export/excel", { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "medications.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  },
  importExcel: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiFetch("/medications/import", { method: "POST", body: fd });
  },
};

export const batchesApi = {
  list: (branchId?: string) => apiFetch<Batch[]>(`/batches${branchId ? `?branchId=${branchId}` : ""}`),
  create: (body: {
    branchId: string;
    medicationId: string;
    supplierId?: string;
    batchNumber: string;
    quantity: number;
    buyPrice: number;
    producedAt?: string;
    expiresAt: string;
  }) => apiFetch<Batch>("/batches", { method: "POST", body: JSON.stringify(body) }),
};

export const inventoryApi = {
  list: (branchId?: string) => apiFetch<BranchStock[]>(`/inventory${branchId ? `?branchId=${branchId}` : ""}`),
  lowStock: (branchId?: string) => apiFetch<BranchStock[]>(`/inventory/low-stock${branchId ? `?branchId=${branchId}` : ""}`),
  nearExpiry: (branchId?: string) => apiFetch<Batch[]>(`/inventory/near-expiry${branchId ? `?branchId=${branchId}` : ""}`),
  stale: (branchId?: string) => apiFetch<BranchStock[]>(`/inventory/stale${branchId ? `?branchId=${branchId}` : ""}`),
  transfer: (body: {
    fromBranchId: string;
    toBranchId: string;
    medicationId: string;
    batchId?: string;
    quantity: number;
  }) => apiFetch("/inventory/transfer", { method: "POST", body: JSON.stringify(body) }),
  stocktake: (body: { branchId: string; medicationId: string; countedQuantity: number; reason: string }) =>
    apiFetch("/inventory/stocktake", { method: "POST", body: JSON.stringify(body) }),
};

export const suppliersApi = {
  list: () => apiFetch<Supplier[]>("/suppliers"),
  create: (body: { name: string; phone?: string }) =>
    apiFetch<Supplier>("/suppliers", { method: "POST", body: JSON.stringify(body) }),
  statement: (id: string) => apiFetch<SupplierStatement>(`/suppliers/${id}/statement`),
};

export const purchasesApi = {
  list: (branchId?: string) => apiFetch<PurchaseInvoice[]>(`/purchases${branchId ? `?branchId=${branchId}` : ""}`),
  create: (body: {
    branchId: string;
    supplierId: string;
    invoiceNumber: string;
    paid: number;
    items: { medicationId: string; batchNumber: string; quantity: number; buyPrice: number; producedAt?: string; expiresAt: string }[];
  }) => apiFetch<PurchaseInvoice>("/purchases", { method: "POST", body: JSON.stringify(body) }),
  recordPayment: (id: string, amount: number) =>
    apiFetch(`/purchases/${id}/payments`, { method: "POST", body: JSON.stringify({ amount }) }),
};

export const salesApi = {
  list: (params?: { branchId?: string; from?: string; to?: string }) => {
    const q = new URLSearchParams();
    if (params?.branchId) q.set("branchId", params.branchId);
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const qs = q.toString();
    return apiFetch<SalesInvoice[]>(`/sales${qs ? `?${qs}` : ""}`);
  },
  create: (body: {
    branchId: string;
    customerId?: string;
    items: { medicationId: string; quantity: number; discount?: number }[];
    paymentMethod: "CASH" | "CREDIT";
  }) => apiFetch<SalesInvoice>("/sales", { method: "POST", body: JSON.stringify(body) }),
  hold: (body: {
    branchId: string;
    customerId?: string;
    items: { medicationId: string; quantity: number }[];
    paymentMethod: "CASH" | "CREDIT";
  }) => apiFetch<SalesInvoice>("/sales/hold", { method: "POST", body: JSON.stringify(body) }),
  get: (id: string) => apiFetch<SalesInvoiceDetail>(`/sales/${id}`),
  cancel: (id: string, reason: string) =>
    apiFetch(`/sales/${id}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }),
  return: (id: string, body: { reason: string; items: { salesInvoiceItemId: string; quantity: number; restockToBatch?: boolean }[] }) =>
    apiFetch(`/sales/${id}/returns`, { method: "POST", body: JSON.stringify(body) }),
};

export const customersApi = {
  list: () => apiFetch<Customer[]>("/customers"),
  create: (body: { name: string; phone?: string }) =>
    apiFetch<Customer>("/customers", { method: "POST", body: JSON.stringify(body) }),
  statement: (id: string) => apiFetch<CustomerStatement>(`/customers/${id}/statement`),
  recordPayment: (id: string, amount: number, note?: string) =>
    apiFetch(`/customers/${id}/payments`, { method: "POST", body: JSON.stringify({ amount, note }) }),
};

export const expensesApi = {
  list: (branchId?: string) => apiFetch<Expense[]>(`/expenses${branchId ? `?branchId=${branchId}` : ""}`),
  create: (body: { type: string; amount: number; branchId?: string; date?: string; note?: string }) =>
    apiFetch<Expense>("/expenses", { method: "POST", body: JSON.stringify(body) }),
};

export const reportsApi = {
  salesSummary: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const qs = q.toString();
    return apiFetch<{
      invoiceCount: number;
      totalSales: string;
      totalTax: string;
      cashSales: string;
      creditSales: string;
    }>(`/reports/sales-summary${qs ? `?${qs}` : ""}`);
  },
  topProducts: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const qs = q.toString();
    return apiFetch<{ name: string; qty: number }[]>(`/reports/top-products${qs ? `?${qs}` : ""}`);
  },
  byBranch: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const qs = q.toString();
    return apiFetch<{ branchName: string; total: string; count: number }[]>(`/reports/by-branch${qs ? `?${qs}` : ""}`);
  },
  debtsAndDues: () =>
    apiFetch<{ customerDebt: string; supplierDue: string }>("/reports/debts-and-dues"),
  estimatedProfit: (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set("from", from);
    if (to) q.set("to", to);
    const qs = q.toString();
    return apiFetch<{
      revenue: string;
      estimatedNetProfit: string;
      disclaimer: string;
    }>(`/reports/estimated-profit${qs ? `?${qs}` : ""}`);
  },
  inventoryValue: () =>
    apiFetch<{ atBuyPrice: string; atSellPrice: string; itemCount: number }>("/reports/inventory-value"),
};

export const govApi = {
  list: () => apiFetch<GovLog[]>("/gov-integration"),
  retry: (id: string) => apiFetch(`/gov-integration/${id}/retry`, { method: "POST" }),
};

export const securityApi = {
  auditLogs: () => apiFetch<AuditLog[]>("/security/audit-logs"),
  backups: () => apiFetch<BackupRecord[]>("/security/backups"),
};
