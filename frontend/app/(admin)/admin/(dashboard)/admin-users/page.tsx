"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminDataTable } from "@/app/(admin)/_components/admin-data-table";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { AdminUserPanelForm } from "@/app/(admin)/admin/(dashboard)/admin-users/_components/admin-user-panel-form";

type PanelMode = "create" | "edit" | null;

const tableColumns = [
  { key: "username", header: "아이디" },
  { key: "role", header: "역할" },
  { key: "status", header: "상태" },
  { key: "last_login", header: "마지막 로그인" },
  { key: "created_at", header: "생성일" },
];

export default function AdminUsersPage() {
  const [panelMode, setPanelMode] = useState<PanelMode>(null);

  function openCreatePanel() {
    setPanelMode("create");
  }

  function closePanel() {
    setPanelMode(null);
  }

  return (
    <>
      <AdminPageHeader
        action={
          <AdminButton
            className="h-11 w-auto gap-2 px-5"
            onClick={openCreatePanel}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            어드민 생성
          </AdminButton>
        }
        description="어드민 계정과 권한을 관리합니다."
        title="어드민 회원"
      />

      <AdminDataTable columns={tableColumns} emptyMessage="등록된 어드민이 없습니다." />

      <AdminSlidePanel
        description={
          panelMode === "create"
            ? "새 어드민 계정을 등록합니다."
            : "어드민 계정 정보를 수정합니다."
        }
        footer={
          panelMode ? <AdminPanelFooter mode={panelMode} onCancel={closePanel} /> : null
        }
        onClose={closePanel}
        open={panelMode !== null}
        title={panelMode === "create" ? "어드민 생성" : "어드민 수정"}
      >
        {panelMode ? <AdminUserPanelForm key={panelMode} mode={panelMode} /> : null}
      </AdminSlidePanel>
    </>
  );
}
