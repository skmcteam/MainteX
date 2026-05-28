"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { AssetFormModal } from "./asset-form-modal";
import type { AssetDetail, AssetFormData } from "@/app/(app)/assets/actions";

interface Props {
  asset: AssetDetail;
  formData: AssetFormData;
}

export function AssetEditButton({ asset, formData }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
        style={{ borderColor: "var(--line)", color: "var(--text-sub)", background: "var(--panel-2)" }}
      >
        <Pencil size={13} />
        แก้ไข
      </button>
      <AssetFormModal
        open={open}
        onClose={() => setOpen(false)}
        category={asset.category as "MACHINE" | "MOLD" | "IT" | "INSTRUMENT"}
        formData={formData}
        editAsset={asset}
      />
    </>
  );
}
