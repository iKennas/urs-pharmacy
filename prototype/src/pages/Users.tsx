import { useState } from "react";
import { Plus, Check } from "lucide-react";
import { Button, Card, PageHeader, StatusBadge, Table, Td, Tr } from "../components/ui";
import { branchesApi, rolesApi, usersApi } from "../api";
import type { Permission, User } from "../api/types";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { label } from "../lib/labels";
import { Can } from "../components/Can";
import { Modal, Field, inputClass, FormError } from "../components/Modal";

const ALL_PERMISSIONS: Permission[] = ["VIEW", "CREATE", "UPDATE", "DELETE", "PRINT", "DISCOUNT", "RETURN", "ADJUST_STOCK"];

export default function UsersPage() {
  const [tab, setTab] = useState<"users" | "roles">("users");
  const { data: users, loading: l1, error: e1, reload: r1 } = useAsyncData(() => usersApi.list(), []);
  const { data: roles, loading: l2, error: e2, reload: r2 } = useAsyncData(() => rolesApi.list(), []);
  const { data: branches } = useAsyncData(() => branchesApi.list(), []);

  const [showInvite, setShowInvite] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editRoleId, setEditRoleId] = useState<string | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<Permission[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (l1 || l2) return <LoadingState />;
  if (e1 || e2) return <ErrorState message={e1 ?? e2 ?? ""} />;

  async function saveInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await usersApi.invite({
        name: String(fd.get("name")),
        email: String(fd.get("email")),
        roleId: String(fd.get("roleId")),
        branchId: String(fd.get("branchId") || "") || undefined,
      });
      setShowInvite(false);
      r1();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل إرسال الدعوة");
    } finally {
      setSaving(false);
    }
  }

  async function saveUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editUser) return;
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    try {
      await usersApi.update(editUser.id, {
        name: String(fd.get("name")),
        roleId: String(fd.get("roleId")),
        branchId: String(fd.get("branchId") || "") || undefined,
      });
      setEditUser(null);
      r1();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل التحديث");
    } finally {
      setSaving(false);
    }
  }

  async function saveRole(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name"));
    try {
      if (editRoleId) {
        await rolesApi.update(editRoleId, { permissions: selectedPerms });
      } else {
        await rolesApi.create({ name, permissions: selectedPerms });
      }
      setShowRole(false);
      setEditRoleId(null);
      setSelectedPerms([]);
      r2();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  async function toggleSuspend(u: User) {
    try {
      if (u.status === "SUSPENDED") await usersApi.reactivate(u.id);
      else await usersApi.suspend(u.id);
      r1();
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشلت العملية");
    }
  }

  function togglePerm(p: Permission) {
    setSelectedPerms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  }

  return (
    <div>
      <PageHeader
        title="المستخدمون والصلاحيات"
        subtitle="إضافة الموظفين وإرسال دعوات إنشاء الحساب عبر البريد، وتحديد الأدوار والصلاحيات الدقيقة لكل مستخدم"
        action={
          <Can perm="CREATE">
            <Button onClick={() => tab === "users" ? setShowInvite(true) : (setEditRoleId(null), setSelectedPerms([]), setShowRole(true))}>
              <Plus size={16} /> {tab === "users" ? "دعوة مستخدم" : "إضافة دور"}
            </Button>
          </Can>
        }
      />

      <div className="flex gap-2 mb-5">
        <button onClick={() => setTab("users")} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === "users" ? "bg-urs-green text-white" : "bg-white border border-urs-border text-slate-600"}`}>
          المستخدمون
        </button>
        <button onClick={() => setTab("roles")} className={`px-4 py-2 rounded-xl text-sm font-bold ${tab === "roles" ? "bg-urs-green text-white" : "bg-white border border-urs-border text-slate-600"}`}>
          الأدوار والصلاحيات
        </button>
      </div>

      {tab === "users" ? (
        <Card noPad>
          <div className="p-5">
            <Table head={["الاسم", "البريد الإلكتروني", "الدور", "الفرع", "الحالة", ""]}>
              {(users ?? []).map((u) => (
                <Tr key={u.id}>
                  <Td className="font-semibold">{u.name}</Td>
                  <Td className="text-slate-500" dir="ltr">{u.email}</Td>
                  <Td>{u.role.name}</Td>
                  <Td className="text-slate-500">{u.branch?.name ?? "كل الفروع"}</Td>
                  <Td><StatusBadge status={label("user", u.status)} /></Td>
                  <Td>
                    <div className="flex gap-2">
                      <Can perm="UPDATE">
                        <button className="text-xs font-bold text-urs-green" onClick={() => setEditUser(u)}>تعديل</button>
                        {u.status !== "INVITED" && (
                          <button className="text-xs font-bold text-slate-400" onClick={() => toggleSuspend(u)}>
                            {u.status === "SUSPENDED" ? "تفعيل" : "إيقاف"}
                          </button>
                        )}
                      </Can>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {(roles ?? []).map((r) => (
            <Card key={r.id}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold">{r.name}</p>
                <div className="flex items-center gap-2">
                  {r.isSystem && <span className="text-xs text-slate-400">افتراضي</span>}
                  <Can perm="UPDATE">
                    {!r.isSystem && (
                      <button
                        className="text-xs font-bold text-urs-green"
                        onClick={() => { setEditRoleId(r.id); setSelectedPerms([...r.permissions]); setShowRole(true); }}
                      >
                        تعديل
                      </button>
                    )}
                  </Can>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {r.permissions.map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 text-xs bg-urs-green-lighter text-urs-green-dark px-2 py-1 rounded-lg">
                    <Check size={11} /> {label("permission", p)}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showInvite} onClose={() => setShowInvite(false)} title="دعوة مستخدم جديد">
        <form onSubmit={saveInvite}>
          <FormError message={formError} />
          <Field label="الاسم"><input name="name" required className={inputClass} /></Field>
          <Field label="البريد الإلكتروني"><input name="email" type="email" required className={inputClass} dir="ltr" /></Field>
          <Field label="الدور">
            <select name="roleId" required className={inputClass}>
              <option value="">اختر الدور</option>
              {(roles ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="الفرع" hint="اتركه فارغًا للوصول لكل الفروع">
            <select name="branchId" className={inputClass}>
              <option value="">كل الفروع</option>
              {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </Field>
          <Button type="submit" disabled={saving}>{saving ? "جاري الإرسال..." : "إرسال الدعوة"}</Button>
        </form>
      </Modal>

      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="تعديل المستخدم">
        {editUser && (
          <form onSubmit={saveUser}>
            <FormError message={formError} />
            <Field label="الاسم"><input name="name" required defaultValue={editUser.name} className={inputClass} /></Field>
            <Field label="الدور">
              <select name="roleId" required defaultValue={editUser.role.id} className={inputClass}>
                {(roles ?? []).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </Field>
            <Field label="الفرع">
              <select name="branchId" defaultValue={editUser.branch?.id ?? ""} className={inputClass}>
                <option value="">كل الفروع</option>
                {(branches ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <Button type="submit" disabled={saving}>حفظ</Button>
          </form>
        )}
      </Modal>

      <Modal open={showRole} onClose={() => { setShowRole(false); setEditRoleId(null); }} title={editRoleId ? "تعديل صلاحيات الدور" : "إضافة دور جديد"}>
        <form onSubmit={saveRole}>
          <FormError message={formError} />
          {!editRoleId && (
            <Field label="اسم الدور"><input name="name" required className={inputClass} /></Field>
          )}
          <Field label="الصلاحيات">
            <div className="flex flex-wrap gap-2">
              {ALL_PERMISSIONS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePerm(p)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold ${selectedPerms.includes(p) ? "bg-urs-green text-white border-urs-green" : "bg-white border-urs-border text-slate-600"}`}
                >
                  {label("permission", p)}
                </button>
              ))}
            </div>
          </Field>
          <Button type="submit" disabled={saving || selectedPerms.length === 0}>حفظ</Button>
        </form>
      </Modal>
    </div>
  );
}
