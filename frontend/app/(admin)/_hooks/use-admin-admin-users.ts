"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminPageSize } from "@/app/(admin)/_components/admin-pagination";
import {
  fetchAdminApiJson,
  type PaginatedResponse,
} from "@/app/(admin)/_lib/admin-api";
import { adminListQueryOptions } from "@/app/(admin)/_lib/admin-query-config";
import type { AdminUserListItem } from "@/app/(admin)/admin/(dashboard)/admin-users/_types";

export const adminAdminUserKeys = {
  all: ["admin", "admin-users"] as const,
  list: (page: number, pageSize: AdminPageSize) =>
    [...adminAdminUserKeys.all, "list", { page, pageSize }] as const,
};

function adminUsersPath(page: number, pageSize: AdminPageSize) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return `/api/v2/admin/admin-users?${params.toString()}`;
}

function fetchAdminUserList(page: number, pageSize: AdminPageSize, signal?: AbortSignal) {
  return fetchAdminApiJson<PaginatedResponse<AdminUserListItem>>(
    adminUsersPath(page, pageSize),
    { cache: "no-store", signal },
  );
}

export function useAdminAdminUsers(page: number, pageSize: AdminPageSize) {
  return useQuery({
    queryKey: adminAdminUserKeys.list(page, pageSize),
    queryFn: ({ signal }) => fetchAdminUserList(page, pageSize, signal),
    ...adminListQueryOptions,
  });
}

type AdminUserWrite =
  | { username: string; password: string; role: string }
  | { role: string; is_active: boolean; password?: string };

export function useCreateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminUserWrite) =>
      fetchAdminApiJson<AdminUserListItem>("/api/v2/admin/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminAdminUserKeys.all }),
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: AdminUserWrite }) =>
      fetchAdminApiJson<AdminUserListItem>(`/api/v2/admin/admin-users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminAdminUserKeys.all }),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAdminApiJson<AdminUserListItem>(`/api/v2/admin/admin-users/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminAdminUserKeys.all }),
  });
}
