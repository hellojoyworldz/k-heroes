"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ActiveFilterValue } from "@/app/(admin)/_components/admin-active-filter";
import type { AdminPageSize } from "@/app/(admin)/_components/admin-pagination";
import {
  fetchAdminApiJson,
  type PaginatedResponse,
} from "@/app/(admin)/_lib/admin-api";
import type { CharacterCategoryListItem } from "@/app/(admin)/admin/(dashboard)/character-categories/_types";

export const adminCategoryKeys = {
  all: ["admin", "categories"] as const,
  list: (filter: ActiveFilterValue, page: number, pageSize: AdminPageSize) =>
    [...adminCategoryKeys.all, "list", { filter, page, pageSize }] as const,
  options: () => [...adminCategoryKeys.all, "options"] as const,
};

function getCategoriesPath(filter: ActiveFilterValue, page: number, pageSize: AdminPageSize) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (filter === "active") params.set("is_active", "true");
  if (filter === "inactive") params.set("is_active", "false");
  return `/api/v2/admin/character-categories?${params.toString()}`;
}

function fetchCategoryList(
  filter: ActiveFilterValue,
  page: number,
  pageSize: AdminPageSize,
  signal?: AbortSignal,
) {
  return fetchAdminApiJson<PaginatedResponse<CharacterCategoryListItem>>(
    getCategoriesPath(filter, page, pageSize),
    { cache: "no-store", signal },
  );
}

function categoryOptionsQuery() {
  return {
    queryKey: adminCategoryKeys.options(),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      fetchCategoryList("all", 1, 100, signal).then((data) => data.items),
    staleTime: Infinity,
    gcTime: Infinity,
  };
}

export function useAdminCategories(
  filter: ActiveFilterValue,
  page: number,
  pageSize: AdminPageSize,
) {
  return useQuery({
    queryKey: adminCategoryKeys.list(filter, page, pageSize),
    queryFn: ({ signal }) => fetchCategoryList(filter, page, pageSize, signal),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}

export function useAdminCategoryOptions() {
  return useQuery(categoryOptionsQuery());
}

export function fetchAdminCategoryOptions(queryClient: QueryClient) {
  return queryClient.fetchQuery(categoryOptionsQuery());
}

type CategoryWrite = {
  title: string;
  description: string;
  is_active?: boolean;
};

export function useCreateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CategoryWrite) =>
      fetchAdminApiJson<CharacterCategoryListItem>("/api/v2/admin/character-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all }),
  });
}

export function useUpdateAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: CategoryWrite }) =>
      fetchAdminApiJson<CharacterCategoryListItem>(
        `/api/v2/admin/character-categories/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all }),
  });
}

export function useDeleteAdminCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAdminApiJson<CharacterCategoryListItem>(
        `/api/v2/admin/character-categories/${id}`,
        { method: "DELETE" },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all }),
  });
}

export function useReorderAdminCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: number[]) =>
      fetchAdminApiJson<CharacterCategoryListItem[]>(
        "/api/v2/admin/character-categories/reorder",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        },
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCategoryKeys.all }),
  });
}
