"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { getDepartmentsAdmin, createDepartment, updateDepartment, createSection, updateSection } from "@/app/(app)/admin/actions";
import { SimpleFormModal } from "@/components/admin/simple-form-modal";
import { toast } from "sonner";
import { prisma } from "@/lib/prisma";

type Dept = Awaited<ReturnType<typeof getDepartmentsAdmin>>[number];

export default function DepartmentsPage() {
  const router = useRouter();
  const [depts, setDepts] = useState<Dept[]>([]);
  const [plantId, setPlantId] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<null | { type: "dept" | "section"; edit?: Dept | Dept["sections"][number]; deptId?: string }>(null);

  const load = async () => {
    const data = await getDepartmentsAdmin();
    setDepts(data);
    if (data[0]) setPlantId(data[0].plantId);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = (id: string) => setExpanded((prev) => {
    const next = new Set(prev);
    if (next.has(id)) { next.delete(id); } else { next.add(id); }
    return next;
  });

  if (loading) return <div className="py-8 text-center text-xs" style={{ color: "var(--text-sub)" }}>กำลังโหลด...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[17px] font-semibold" style={{ color: "var(--text)" }}>แผนก / หน่วยงาน</h1>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-sub)" }}>โครงสร้างองค์กร · {depts.length} แผนก</p>
        </div>
        <button onClick={() => setModal({ type: "dept" })}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
          style={{ background: "var(--brand)" }}>
          <Plus size={13} /> เพิ่มแผนก
        </button>
      </div>

      <div className="panel-border overflow-hidden">
        {depts.map((dept) => (
          <div key={dept.id} style={{ borderBottom: "0.5px solid var(--line)" }}>
            <div
              className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-panel-2"
              onClick={() => toggle(dept.id)}
            >
              {expanded.has(dept.id) ? <ChevronDown size={14} style={{ color: "var(--text-sub)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-sub)" }} />}
              <Building2 size={14} style={{ color: "var(--brand)" }} />
              <div className="flex-1">
                <span className="text-xs font-semibold font-mono-num" style={{ color: "var(--brand)" }}>{dept.code}</span>
                <span className="ml-2 text-xs font-medium" style={{ color: "var(--text)" }}>{dept.nameTh}</span>
                <span className="ml-1 text-xs" style={{ color: "var(--text-sub)" }}>({dept.nameEn})</span>
              </div>
              <span className="text-xs" style={{ color: "var(--text-sub)" }}>{dept._count.users} คน · {dept._count.assets} assets</span>
              <button onClick={(e) => { e.stopPropagation(); setModal({ type: "dept", edit: dept }); }}
                className="rounded-md px-2 py-1 text-[10px]" style={{ background: "var(--panel-2)", color: "var(--text-sub)" }}>แก้ไข</button>
              <button onClick={(e) => { e.stopPropagation(); setModal({ type: "section", deptId: dept.id }); }}
                className="rounded-md px-2 py-1 text-[10px]" style={{ background: "var(--brand-soft)", color: "var(--brand)" }}>+ ส่วนงาน</button>
            </div>
            {expanded.has(dept.id) && dept.sections.map((sec) => (
              <div key={sec.id} className="flex items-center gap-3 border-t px-4 py-2.5 pl-12" style={{ borderColor: "var(--line)", background: "var(--panel-2)" }}>
                <div className="flex-1">
                  <span className="text-xs font-mono-num" style={{ color: "var(--text-sub)" }}>{sec.code}</span>
                  <span className="ml-2 text-xs font-medium" style={{ color: "var(--text)" }}>{sec.nameTh}</span>
                </div>
                <button onClick={() => setModal({ type: "section", edit: sec, deptId: dept.id })}
                  className="rounded-md px-2 py-1 text-[10px]" style={{ background: "var(--panel)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>แก้ไข</button>
              </div>
            ))}
          </div>
        ))}
      </div>

      {modal?.type === "dept" && (
        <SimpleFormModal
          open
          onClose={() => { setModal(null); load(); }}
          title={modal.edit ? "แก้ไขแผนก" : "เพิ่มแผนก"}
          fields={[
            { key: "code", label: "รหัส", required: true, placeholder: "MAINT" },
            { key: "nameTh", label: "ชื่อภาษาไทย", required: true, placeholder: "แผนกซ่อมบำรุง" },
            { key: "nameEn", label: "ชื่อภาษาอังกฤษ", required: true, placeholder: "Maintenance" },
          ]}
          defaultValues={modal.edit ? { code: (modal.edit as Dept).code, nameTh: (modal.edit as Dept).nameTh, nameEn: (modal.edit as Dept).nameEn } : {}}
          onSave={async (v) => {
            const payload = { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), plantId };
            if (modal.edit) await updateDepartment((modal.edit as Dept).id, payload);
            else await createDepartment(payload);
          }}
        />
      )}

      {modal?.type === "section" && (
        <SimpleFormModal
          open
          onClose={() => { setModal(null); load(); }}
          title={modal.edit ? "แก้ไขส่วนงาน" : "เพิ่มส่วนงาน"}
          fields={[
            { key: "code", label: "รหัส", required: true, placeholder: "MAINT-ELEC" },
            { key: "nameTh", label: "ชื่อภาษาไทย", required: true, placeholder: "ซ่อมบำรุงไฟฟ้า" },
            { key: "nameEn", label: "ชื่อภาษาอังกฤษ", required: true, placeholder: "Electrical Maintenance" },
          ]}
          defaultValues={modal.edit ? { code: (modal.edit as Dept["sections"][number]).code, nameTh: (modal.edit as Dept["sections"][number]).nameTh, nameEn: (modal.edit as Dept["sections"][number]).nameEn } : {}}
          onSave={async (v) => {
            const payload = { code: String(v.code), nameTh: String(v.nameTh), nameEn: String(v.nameEn), departmentId: modal.deptId! };
            if (modal.edit) await updateSection((modal.edit as Dept["sections"][number]).id, payload);
            else await createSection(payload);
          }}
        />
      )}
    </div>
  );
}
