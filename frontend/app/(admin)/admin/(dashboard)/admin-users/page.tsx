"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminPanelFooter } from "@/app/(admin)/_components/admin-panel-footer";
import { AdminPageHeader } from "@/app/(admin)/_components/admin-page-header";
import { AdminSlidePanel } from "@/app/(admin)/_components/admin-slide-panel";
import { fetchAdminApi } from "@/app/(admin)/_lib/admin-api";
import { AdminUserPanelForm } from "@/app/(admin)/admin/(dashboard)/admin-users/_components/admin-user-panel-form";
import { AdminUserTable } from "@/app/(admin)/admin/(dashboard)/admin-users/_components/admin-user-table";
import type { AdminUserListItem } from "@/app/(admin)/admin/(dashboard)/admin-users/_types";

type PanelMode = "create" | "edit" | null;

function requestAdminUsers(signal?: AbortSignal) {
  return fetchAdminApi("/api/v2/admin/admin-users", {
    cache: "no-store",
    signal,
  });
}

export default function AdminUsersPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [panelMode, setPanelMode] = useState<PanelMode>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserListItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [panelError, setPanelError] = useState("");

  async function loadUsers() {
    setIsLoading(true);
    setPageError("");

    try {
      const response = await requestAdminUsers();

      if (response.status === 401) {
        router.replace("/admin/login");
        return;
      }
      if (!response.ok) {
        throw new Error("어드민 목록을 불러오지 못했습니다.");
      }

      setUsers((await response.json()) as AdminUserListItem[]);
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "어드민 목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialUsers() {
      try {
        const response = await requestAdminUsers(controller.signal);

        if (response.status === 401) {
          router.replace("/admin/login");
          return;
        }
        if (!response.ok) {
          throw new Error("어드민 목록을 불러오지 못했습니다.");
        }

        setUsers((await response.json()) as AdminUserListItem[]);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setPageError(
            error instanceof Error
              ? error.message
              : "어드민 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadInitialUsers();
    return () => controller.abort();
  }, [router]);

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

  async function getMutationError(
    response: Response,
    mode: "create" | "edit" | "delete",
  ) {
    if (response.status === 401) return "로그인이 만료되었습니다.";
    if (response.status === 422) return "입력 내용을 확인해 주세요.";

    try {
      const data = (await response.json()) as { detail?: unknown };
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail;
      }
    } catch {
      // 응답 본문이 JSON이 아니면 상태별 기본 메시지를 사용합니다.
    }

    return mode === "delete" ? "삭제하지 못했습니다." : "저장하지 못했습니다.";
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

    setIsSaving(true);
    setPanelError("");

    try {
      const path =
        panelMode === "create"
          ? "/api/v2/admin/admin-users"
          : `/api/v2/admin/admin-users/${selectedUser?.id}`;
      const response = await fetchAdminApi(path, {
        method: panelMode === "create" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        setPanelError(await getMutationError(response, panelMode));
        if (response.status === 401) router.replace("/admin/login");
        return;
      }

      const savedUser = (await response.json()) as AdminUserListItem;
      setUsers((current) =>
        panelMode === "create"
          ? [...current, savedUser].sort((a, b) => a.id - b.id)
          : current.map((user) => (user.id === savedUser.id ? savedUser : user)),
      );
      resetPanel();
    } catch {
      setPanelError("API 서버에 연결할 수 없습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedUser) return;

    setIsDeleting(true);
    setPanelError("");

    try {
      const response = await fetchAdminApi(
        `/api/v2/admin/admin-users/${selectedUser.id}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        setPanelError(await getMutationError(response, "delete"));
        if (response.status === 401) router.replace("/admin/login");
        return;
      }

      setUsers((current) => current.filter((user) => user.id !== selectedUser.id));
      resetPanel();
    } catch {
      setPanelError("API 서버에 연결할 수 없습니다.");
    } finally {
      setIsDeleting(false);
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

      {pageError ? (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-[#E6C9C5] bg-[#FDF6F5] px-5 py-4 text-sm text-[#9A3F38]">
          <p>{pageError}</p>
          <button
            className="shrink-0 font-medium underline"
            onClick={() => void loadUsers()}
            type="button"
          >
            다시 시도
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-[#E8E4DC] bg-white px-5 py-16 text-center text-sm text-[#8A847C]">
          어드민 목록을 불러오고 있습니다.
        </div>
      ) : (
        <AdminUserTable onRowClick={openEditPanel} users={users} />
      )}

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
