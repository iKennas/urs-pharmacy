export type Permission =
  | "VIEW"
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PRINT"
  | "DISCOUNT"
  | "RETURN"
  | "ADJUST_STOCK";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleName: string;
  permissions: Permission[];
  branchId: string | null;
  branchName: string | null;
  pharmacyId: string;
  pharmacyName: string;
}

export interface SystemAdmin {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface AdminLoginResponse {
  accessToken: string;
  admin: SystemAdmin;
}

export interface Pharmacy {
  id: string;
  name: string;
  logoUrl: string | null;
  taxNumber: string | null;
  commercialRegister: string | null;
  invoiceFooterNote: string | null;
  planName: string;
  maxBranches: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  subscriptionStatus: string;
  _count?: { branches: number; users: number };
}

export interface Branch {
  id: string;
  name: string;
  city: string;
  status: string;
  _count?: { users: number };
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  isSystem: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  status: string;
  role: { id: string; name: string; permissions: Permission[] };
  branch: { id: string; name: string } | null;
}

export interface Category {
  id: string;
  name: string;
}

export interface Medication {
  id: string;
  name: string;
  scientificName: string | null;
  barcode: string;
  manufacturer: string | null;
  form: string | null;
  saleUnit: string;
  buyPrice: string;
  sellPrice: string;
  taxRate: string;
  minStock: number;
  category: Category | null;
}

export interface Batch {
  id: string;
  batchNumber: string;
  quantity: number;
  buyPrice: string;
  producedAt: string;
  expiresAt: string;
  status: string;
  medication: { id: string; name: string };
  supplier: { id: string; name: string } | null;
  branch: { id: string; name: string };
}

export interface BranchStock {
  id: string;
  quantity: number;
  medication: Medication;
  branch: { id: string; name: string };
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  total: string;
  paid: string;
  status: string;
  supplier: Supplier;
  branch: { id: string; name: string };
}

export interface SalesInvoiceItem {
  id: string;
  quantity: number;
  unitPrice: string;
  discount?: string;
  taxAmount?: string;
  medication: { id: string; name: string };
  batch: { batchNumber: string } | null;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  subtotal: string;
  taxTotal: string;
  total: string;
  paymentMethod: string;
  status: string;
  createdAt: string;
  cancelReason: string | null;
  zatcaQrPayload: string | null;
  customer: { id: string; name: string } | null;
  cashierUser: { id: string; name: string };
  branch: { id: string; name: string };
  items?: SalesInvoiceItem[];
}

export interface SalesInvoiceDetail extends SalesInvoice {
  items: SalesInvoiceItem[];
  returns?: { id: string; reason: string; createdAt: string }[];
}

export interface CustomerStatement {
  customer: Customer;
  invoices: SalesInvoice[];
  payments: { id: string; amount: string; note: string | null; createdAt: string }[];
  totalInvoiced: number;
  totalPaid: number;
  balanceDue: number;
}

export interface SupplierStatement {
  supplier: Supplier;
  invoices: (PurchaseInvoice & { items?: { quantity: number; medication: { name: string } }[] })[];
  totalInvoiced: number;
  totalPaid: number;
  balanceDue: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  type: string;
  amount: string;
  date: string;
  branch: { id: string; name: string } | null;
}

export interface GovLog {
  id: string;
  type: string;
  status: string;
  retryCount: number;
  createdAt: string;
  salesInvoice: { invoiceNumber: string };
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: string;
  user: { name: string } | null;
}

export interface BackupRecord {
  id: string;
  sizeBytes: string;
  location: string;
  status: string;
  createdAt: string;
}
