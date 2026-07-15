import { useState } from "react";
import { DatabaseBackup, KeyRound, ScrollText, ShieldCheck } from "lucide-react";
import { Button, Card, PageHeader, Table, Td, Tr } from "../components/ui";
import { securityApi } from "../api";
import { useAsyncData } from "../hooks/useAsyncData";
import { LoadingState, ErrorState } from "../components/AsyncState";
import { dateAr } from "../lib/labels";
import { Modal } from "../components/Modal";

const items = [
  { title: "نسخ احتياطية دورية", desc: "يتم إنشاء نسخ احتياطية دورية تلقائيًا — راجع القائمة أدناه", icon: DatabaseBackup },
  { title: "عزل بيانات الصيدليات", desc: "بيانات كل صيدلية معزولة تمامًا عن الصيدليات الأخرى", icon: ShieldCheck },
  { title: "تشفير البيانات الحساسة", desc: "تشفير كلمات المرور وبيانات الربط الحكومي", icon: KeyRound },
  { title: "سجل العمليات الحساسة", desc: "تسجيل عمليات الدخول والخروج وكل العمليات الحساسة", icon: ScrollText },
];

export default function Security() {
  const { data: logs, loading: l1, error: e1 } = useAsyncData(() => securityApi.auditLogs(), []);
  const { data: backups, loading: l2, error: e2 } = useAsyncData(() => securityApi.backups(), []);
  const [showBackups, setShowBackups] = useState(false);

  if (l1 || l2) return <LoadingState />;
  if (e1 || e2) return <ErrorState message={e1 ?? e2 ?? ""} />;

  function formatSize(bytes: string) {
    const n = parseInt(bytes, 10);
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <div>
      <PageHeader title="النسخ الاحتياطي والأمان" subtitle="إعدادات الحماية، النسخ الاحتياطية، وسجل العمليات الحساسة" />

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {items.map((i) => (
          <Card key={i.title}>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-urs-green-lighter text-urs-green-dark flex items-center justify-center shrink-0">
                <i.icon size={20} />
              </div>
              <div>
                <p className="font-bold mb-1">{i.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{i.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card noPad className="mb-6">
        <div className="p-5">
          <h3 className="font-bold mb-4">سجل المراجعة (آخر العمليات)</h3>
          <Table head={["العملية", "النوع", "المستخدم", "التاريخ"]}>
            {(logs ?? []).slice(0, 15).map((log) => (
              <Tr key={log.id}>
                <Td className="font-semibold">{log.action}</Td>
                <Td className="text-slate-500">{log.entityType}</Td>
                <Td>{log.user?.name ?? "—"}</Td>
                <Td className="text-slate-500 tabular-nums">{dateAr(log.createdAt)}</Td>
              </Tr>
            ))}
          </Table>
        </div>
      </Card>

      <Card className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-bold mb-1">النسخ الاحتياطية ({backups?.length ?? 0})</p>
          <p className="text-xs text-slate-500">يمكن لمدير النظام استعادة أي نسخة احتياطية سابقة</p>
        </div>
        <Button variant="ghost" onClick={() => setShowBackups(true)}>
          <DatabaseBackup size={16} /> عرض النسخ الاحتياطية
        </Button>
      </Card>

      <Modal open={showBackups} onClose={() => setShowBackups(false)} title="النسخ الاحتياطية" wide>
        <Table head={["التاريخ", "الحجم", "الموقع", "الحالة"]}>
          {(backups ?? []).map((b) => (
            <Tr key={b.id}>
              <Td className="text-slate-500 tabular-nums">{dateAr(b.createdAt)}</Td>
              <Td>{formatSize(b.sizeBytes)}</Td>
              <Td className="text-slate-500 text-xs">{b.location}</Td>
              <Td>{b.status}</Td>
            </Tr>
          ))}
        </Table>
        {(backups ?? []).length === 0 && <p className="text-sm text-slate-400 text-center py-6">لا توجد نسخ احتياطية بعد</p>}
      </Modal>
    </div>
  );
}
