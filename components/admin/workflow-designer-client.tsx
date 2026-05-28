"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical, Pencil, Trash2, Check, X, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import type { WorkflowWithSteps } from "@/app/(app)/admin/workflow-designer/actions";
import {
  createWorkflow, deleteWorkflow,
  addStep, updateStep, deleteStep, reorderSteps,
} from "@/app/(app)/admin/workflow-designer/actions";

type Role = { id: string; code: string; nameTh: string };
type Step = WorkflowWithSteps["steps"][number];

const ACTION_LABELS: Record<string, string> = {
  approve: "อนุมัติ",
  reject: "ปฏิเสธ",
  return: "ส่งคืน",
};

function SortableStep({
  step, roles, onEdit, onDelete,
}: { step: Step; roles: Role[]; onEdit: (s: Step) => void; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });
  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    background: "var(--panel-2)" as string,
    border: "0.5px solid var(--line)" as string,
  };
  const role = roles.find((r) => r.code === step.roleCode);

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className="flex items-start gap-3 rounded-xl p-3"
      {...attributes}
    >
      <button
        className="mt-0.5 cursor-grab touch-none rounded p-1 active:cursor-grabbing"
        style={{ color: "var(--text-sub)" }}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: "var(--brand)" }}
      >
        {step.stepNumber}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{step.nameTh}</p>
        <div className="mt-1 flex flex-wrap gap-1">
          <span
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <Shield size={9} /> {role?.nameTh ?? step.roleCode}
          </span>
          {step.allowedActions.map((a) => (
            <span key={a} className="rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: "var(--panel)", color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>
              {ACTION_LABELS[a] ?? a}
            </span>
          ))}
          {step.slaHours && (
            <span className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px]" style={{ background: "var(--warning-soft)", color: "var(--warning)" }}>
              <Clock size={9} /> {step.slaHours}h SLA
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        <button
          onClick={() => onEdit(step)}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-panel-2"
          style={{ color: "var(--text-sub)" }}
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onDelete(step.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          style={{ color: "var(--danger)" }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

function StepForm({
  workflowId, roles, initial, onSave, onCancel,
}: {
  workflowId: string;
  roles: Role[];
  initial?: Step;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [nameTh, setNameTh] = useState(initial?.nameTh ?? "");
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? "");
  const [roleCode, setRoleCode] = useState(initial?.roleCode ?? (roles[0]?.code ?? ""));
  const [actions, setActions] = useState<string[]>(initial?.allowedActions ?? ["approve", "reject"]);
  const [slaHours, setSlaHours] = useState(String(initial?.slaHours ?? ""));
  const [saving, setSaving] = useState(false);

  const toggleAction = (a: string) => setActions((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);

  const handleSave = async () => {
    if (!nameTh.trim() || !nameEn.trim() || !roleCode) return;
    setSaving(true);
    try {
      if (initial) {
        await updateStep(initial.id, { nameTh, nameEn, roleCode, allowedActions: actions, slaHours: slaHours ? Number(slaHours) : null });
      } else {
        await addStep({ workflowId, nameTh, nameEn, roleCode, allowedActions: actions, slaHours: slaHours ? Number(slaHours) : null });
      }
      onSave();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-lg px-3 py-2 text-xs";
  const inputStyle = { background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none" };

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--panel-2)", border: "0.5px solid var(--brand)" }}>
      <p className="text-xs font-semibold" style={{ color: "var(--text)" }}>{initial ? "แก้ไขขั้นตอน" : "เพิ่มขั้นตอน"}</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>ชื่อ (TH) *</label>
          <input value={nameTh} onChange={(e) => setNameTh(e.target.value)} placeholder="อนุมัติหัวหน้า" className={inputCls} style={inputStyle} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>ชื่อ (EN) *</label>
          <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Supervisor Approval" className={inputCls} style={inputStyle} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>Role *</label>
          <select value={roleCode} onChange={(e) => setRoleCode(e.target.value)} className={inputCls} style={inputStyle}>
            {roles.map((r) => <option key={r.code} value={r.code}>{r.nameTh} ({r.code})</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>SLA (ชั่วโมง)</label>
          <input type="number" value={slaHours} onChange={(e) => setSlaHours(e.target.value)} placeholder="48" className={inputCls} style={inputStyle} />
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-sub)" }}>การกระทำที่อนุญาต</label>
        <div className="flex gap-2">
          {["approve", "reject", "return"].map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAction(a)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: actions.includes(a) ? "var(--brand)" : "var(--panel)",
                color: actions.includes(a) ? "#fff" : "var(--text-sub)",
                border: "0.5px solid var(--line)",
              }}
            >
              {actions.includes(a) && <Check size={10} />}
              {ACTION_LABELS[a]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs" style={{ color: "var(--text-sub)", border: "0.5px solid var(--line)" }}>
          <X size={12} /> ยกเลิก
        </button>
        <button onClick={handleSave} disabled={saving || !nameTh.trim() || !nameEn.trim()} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50" style={{ background: "var(--brand)" }}>
          <Check size={12} /> {saving ? "กำลังบันทึก..." : "บันทึก"}
        </button>
      </div>
    </div>
  );
}

export function WorkflowDesignerClient({ workflows: initialWorkflows, roles }: { workflows: WorkflowWithSteps[]; roles: Role[] }) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [selectedId, setSelectedId] = useState<string | null>(initialWorkflows[0]?.id ?? null);
  const [showAddWorkflow, setShowAddWorkflow] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [wfCode, setWfCode] = useState("");
  const [wfNameTh, setWfNameTh] = useState("");
  const [wfNameEn, setWfNameEn] = useState("");

  const selected = workflows.find((w) => w.id === selectedId);

  const reload = () => router.refresh();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !selected) return;
    const oldIdx = selected.steps.findIndex((s) => s.id === active.id);
    const newIdx = selected.steps.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(selected.steps, oldIdx, newIdx);
    // Optimistic update
    setWorkflows((wfs) => wfs.map((w) => w.id === selected.id ? { ...w, steps: reordered } : w));
    try {
      await reorderSteps(selected.id, reordered.map((s) => s.id));
      toast.success("จัดเรียงลำดับแล้ว");
      reload();
    } catch (_e: unknown) {
      toast.error("เกิดข้อผิดพลาด");
      reload();
    }
  }

  async function handleDeleteStep(id: string) {
    if (!confirm("ต้องการลบขั้นตอนนี้?")) return;
    try {
      await deleteStep(id);
      toast.success("ลบขั้นตอนแล้ว");
      reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  }

  async function handleDeleteWorkflow(id: string) {
    if (!confirm("ต้องการลบ workflow นี้?")) return;
    try {
      await deleteWorkflow(id);
      toast.success("ลบ workflow แล้ว");
      setSelectedId(workflows.filter((w) => w.id !== id)[0]?.id ?? null);
      reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  }

  async function handleCreateWorkflow() {
    if (!wfCode.trim() || !wfNameTh.trim() || !wfNameEn.trim()) return;
    try {
      const result = await createWorkflow({ code: wfCode, nameTh: wfNameTh, nameEn: wfNameEn, isDefault: false });
      toast.success("สร้าง workflow แล้ว");
      setSelectedId(result.id);
      setShowAddWorkflow(false);
      setWfCode(""); setWfNameTh(""); setWfNameEn("");
      reload();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-xs";
  const inputStyle = { background: "var(--panel-2)", border: "0.5px solid var(--line)", color: "var(--text)", outline: "none" };

  return (
    <div className="flex gap-4">
      {/* Workflow list (left panel) */}
      <div className="w-56 shrink-0 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold" style={{ color: "var(--text-sub)" }}>WORKFLOWS</p>
          <button
            onClick={() => setShowAddWorkflow((v) => !v)}
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
          >
            <Plus size={14} />
          </button>
        </div>

        {showAddWorkflow && (
          <div className="flex flex-col gap-2 rounded-xl p-3" style={{ background: "var(--panel-2)", border: "0.5px solid var(--line)" }}>
            <input value={wfCode} onChange={(e) => setWfCode(e.target.value)} placeholder="รหัส (e.g. WF-001)" className={inputCls} style={inputStyle} />
            <input value={wfNameTh} onChange={(e) => setWfNameTh(e.target.value)} placeholder="ชื่อภาษาไทย" className={inputCls} style={inputStyle} />
            <input value={wfNameEn} onChange={(e) => setWfNameEn(e.target.value)} placeholder="ชื่อภาษาอังกฤษ" className={inputCls} style={inputStyle} />
            <button onClick={handleCreateWorkflow} className="w-full rounded-lg py-1.5 text-xs font-medium text-white" style={{ background: "var(--brand)" }}>
              สร้าง Workflow
            </button>
          </div>
        )}

        {workflows.map((wf) => (
          <button
            key={wf.id}
            onClick={() => setSelectedId(wf.id)}
            className="flex w-full items-start gap-2 rounded-xl p-3 text-left transition-all"
            style={{
              background: selectedId === wf.id ? "var(--brand-soft)" : "var(--panel-2)",
              border: `0.5px solid ${selectedId === wf.id ? "var(--brand)" : "var(--line)"}`,
            }}
          >
            <div className="flex-1 min-w-0">
              <p className="truncate text-xs font-semibold" style={{ color: selectedId === wf.id ? "var(--brand)" : "var(--text)" }}>{wf.nameTh}</p>
              <p className="text-[10px]" style={{ color: "var(--text-sub)" }}>{wf.steps.length} ขั้นตอน · {wf._count.workOrders} WO</p>
            </div>
          </button>
        ))}

        {workflows.length === 0 && (
          <p className="text-xs text-center py-4" style={{ color: "var(--text-sub)" }}>ยังไม่มี workflow</p>
        )}
      </div>

      {/* Steps editor (right panel) */}
      <div className="flex-1 panel-border rounded-2xl overflow-hidden">
        {!selected ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2" style={{ color: "var(--text-sub)" }}>
            <p className="text-sm">เลือก workflow เพื่อออกแบบขั้นตอน</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "0.5px solid var(--line)" }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>{selected.nameTh}</p>
                <p className="text-xs" style={{ color: "var(--text-sub)" }}>{selected.code} · {selected.nameEn}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setAddingStep(true)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white"
                  style={{ background: "var(--brand)" }}
                >
                  <Plus size={12} /> เพิ่มขั้นตอน
                </button>
                <button
                  onClick={() => handleDeleteWorkflow(selected.id)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs"
                  style={{ color: "var(--danger)", border: "0.5px solid var(--danger)" }}
                >
                  <Trash2 size={12} /> ลบ
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="p-4 flex flex-col gap-3">
              {addingStep && (
                <StepForm
                  workflowId={selected.id}
                  roles={roles}
                  onSave={() => { setAddingStep(false); reload(); }}
                  onCancel={() => setAddingStep(false)}
                />
              )}
              {editingStep && (
                <StepForm
                  workflowId={selected.id}
                  roles={roles}
                  initial={editingStep}
                  onSave={() => { setEditingStep(null); reload(); }}
                  onCancel={() => setEditingStep(null)}
                />
              )}

              {selected.steps.length === 0 && !addingStep ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: "var(--text-sub)" }}>
                  <p className="text-sm">ยังไม่มีขั้นตอน</p>
                  <button onClick={() => setAddingStep(true)} className="text-xs rounded-lg px-3 py-1.5" style={{ color: "var(--brand)", border: "0.5px solid var(--brand)" }}>
                    + เพิ่มขั้นตอนแรก
                  </button>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={selected.steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-2">
                      {selected.steps.map((step) => (
                        <SortableStep
                          key={step.id}
                          step={step}
                          roles={roles}
                          onEdit={(s) => { setAddingStep(false); setEditingStep(s); }}
                          onDelete={handleDeleteStep}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
