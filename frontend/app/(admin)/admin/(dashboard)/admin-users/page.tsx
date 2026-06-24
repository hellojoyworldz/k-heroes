"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import {
  AdminPagination,
  type AdminPageSize,
} from "@/app/(admin)/_components/admin-pagination";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import {
  useAdminAdminUsers,
  useCreateAdminUser,
  useDeleteAdminUser,
  useUpdateAdminUser,
} from "@/app/(admin)/_hooks/use-admin-admin-users";
import { AdminApiError } from "@/app/(admin)/_lib/admin-api";
import { AdminUserPanelForm } from "@/app/(admin)/admin/(dashboard)/admin-users/_components/admin-user-panel-form";
import { AdminUserTable } from "@/app/(admin)/admin/(dashboard)/admin-users/_components/admin-user-table";
import type { AdminUserListItem } from "@/app/(admin)/admin/(dashboard)/admin-users/_types";

type PanelMode = "create" | "edit" | null;

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<AdminPageSize>(20);
  const [panelError, setPanelError] = useState("");

  const usersQuery = useAdminAdminUsers(page, pageSize);
  const createUser = useCreateAdminUser();
  const updateUser = useUpdateAdminUser();
  const deleteUser = useDeleteAdminUser();

  const users = usersQuery.data?.items ?? [];
  const total = usersQuery.data?.total ?? 0;
  const totalPages = usersQuery.data?.total_pages ?? 0;
  const isLoading = usersQuery.isPending;
  const isRefreshing = usersQuery.isFetching && !usersQuery.isPending;
  const isSaving = createUser.isPending || updateUser.isPending;
  const isDeleting = deleteUser.isPending;
  const pageError = usersQuery.error?.message ?? "";

  useEffect(() => {
    if (usersQuery.error instanceof AdminApiError && usersQuery.error.status === 401) {
      router.replace("/admin/login");
    }
  }, [usersQuery.error, router]);

  function openCreatePanel() {
    setSelectedUser(null);
    setPanelError("");
    setPanelMode("create");
  }

  function openEditPanel(user: AdminUserListItem) {
    setSelectedUser(user);
    setPanelError("");
    setPanelMode("edit");
  }

  function resetPanel() {
    setPanelMode(null);
    setSelectedUser(null);
    setPanelError("");
  }

  function closePanel() {
    if (isSaving || isDeleting) return;
    resetPanel();
  }

  function reloadUsers() {
    void usersQuery.refetch();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!panelMode) return;

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const role = String(formData.get("role") ?? "admin");
    const body =
      panelMode === "create"
        ? {
            username: String(formData.get("username") ?? "").trim(),
            password,
            role,
          }
        : {
            role,
            is_active: formData.get("is_active") === "on",
            ...(password ? { password } : {}),
          };

    setPanelError("");
    try {
      if (panelMode === "create") {
        await createUser.mutateAsync(body);
      } else if (selectedUser) {
        await updateUser.mutateAsync({ id: selectedUser.id, body });
      }
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "저장하지 못했습니다."));
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;

    setPanelError("");
    try {
      await deleteUser.mutateAsync(selectedUser.id);
      if (users.length === 1 && page > 1) setPage((current) => current - 1);
      resetPanel();
    } catch (error) {
      setPanelError(errorMessage(error, "삭제하지 못했습니다."));
    }
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

      <AdminPagination
        disabled={isLoading}
        isRefreshing={isRefreshing}
        onPageChange={setPage}
        onPageSizeChange={(value) => {
          setPage(1);
          setPageSize(value);
        }}
        onRefresh={reloadUsers}
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />

      <AdminUserTable
        errorMessage={pageError}
        isLoading={isLoading}
        onRetry={reloadUsers}
        onRowClick={openEditPanel}
        users={users}
      />

      <AdminSlidePanel
        description={
          panelMode === "create"
            ? "새 어드민 계정을 등록합니다."
            : "어드민 계정 정보를 수정합니다."
        }
        footer={
          panelMode ? (
            <AdminPanelFooter
              deleteConfirmMessage="이 어드민 계정을 삭제하시겠습니까?"
              isDeleting={isDeleting}
              isSaving={isSaving}
              mode={panelMode}
              onCancel={closePanel}
              onDelete={handleDelete}
              onSave={() => formRef.current?.requestSubmit()}
            />
          ) : null
        }
        onClose={closePanel}
        open={panelMode !== null}
        title={panelMode === "create" ? "어드민 생성" : "어드민 수정"}
      >
        {panelMode ? (
          <form
            key={selectedUser?.id ?? "create"}
            ref={formRef}
            className="space-y-5"
            onSubmit={handleSubmit}
          >
            <AdminUserPanelForm mode={panelMode} user={selectedUser ?? undefined} />
            {panelError ? (
              <p
                aria-live="polite"
                className="rounded-lg border border-[#E6C9C5] bg-[#FDF6F5] px-4 py-3 text-sm text-[#9A3F38]"
                role="alert"
              >
                {panelError}
              </p>
            ) : null}
          </form>
        ) : null}
      </AdminSlidePanel>
    </>
  );
}
