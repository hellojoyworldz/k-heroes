"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ActiveFilterValue } from "@/app/(admin)/_components/admin-active-filter";
import type { AdminPageSize } from "@/app/(admin)/_components/admin-pagination";
import {
  fetchAdminApiJson,
  type PaginatedResponse,
} from "@/app/(admin)/_lib/admin-api";
import type { CharacterListItem } from "@/app/(admin)/admin/(dashboard)/characters/_types";
import { formatIdDotLabel } from "@/app/(admin)/_utils";

export type CharacterOption = CharacterListItem & { label: string };

function toCharacterOption(character: CharacterListItem): CharacterOption {
  return {
    ...character,
    label: formatIdDotLabel(character.id, character.name),
  };
}

export function pickCharacterOptionLabel(
  options: CharacterOption[],
  id: number,
  fallback?: { id: number; name: string },
) {
  const found = options.find((option) => option.id === id);
  if (found) return found.label;
  if (fallback) return formatIdDotLabel(fallback.id, fallback.name);
  return "";
}

type CharacterFilters = {
  active: ActiveFilterValue;
  categoryId: number | null;
  name: string;
};

const adminCharacterKeys = {
  all: ["admin", "characters"] as const,
  list: (filters: CharacterFilters, page: number, pageSize: AdminPageSize) =>
    [...adminCharacterKeys.all, "list", { filters, page, pageSize }] as const,
  options: () => [...adminCharacterKeys.all, "options"] as const,
  reorder: (categoryId: number) =>
    [...adminCharacterKeys.all, "reorder", categoryId] as const,
};

function characterListPath(
  filters: CharacterFilters,
  page: number,
  pageSize: AdminPageSize,
) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (filters.active === "active") params.set("is_active", "true");
  if (filters.active === "inactive") params.set("is_active", "false");
  if (filters.categoryId) params.set("category_id", String(filters.categoryId));
  if (filters.name) params.set("name", filters.name);
  return `/api/v2/admin/characters?${params.toString()}`;
}

function fetchCharacterList(
  filters: CharacterFilters,
  page: number,
  pageSize: AdminPageSize,
  signal?: AbortSignal,
) {
  return fetchAdminApiJson<PaginatedResponse<CharacterListItem>>(
    characterListPath(filters, page, pageSize),
    { cache: "no-store", signal },
  );
}

function characterOptionsQuery() {
  return {
    queryKey: adminCharacterKeys.options(),
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      fetchCharacterList({ active: "all", categoryId: null, name: "" }, 1, 100, signal).then(
        (data) => data.items.map(toCharacterOption),
      ),
    staleTime: Infinity,
    gcTime: Infinity,
  };
}

export function useAdminCharacters(
  filters: CharacterFilters,
  page: number,
  pageSize: AdminPageSize,
) {
  return useQuery({
    queryKey: adminCharacterKeys.list(filters, page, pageSize),
    queryFn: ({ signal }) => fetchCharacterList(filters, page, pageSize, signal),
    staleTime: 0,
    refetchOnMount: "always",
    gcTime: 10 * 60 * 1000,
  });
}

export function useAdminCharacterOptions() {
  return useQuery(characterOptionsQuery());
}

export function fetchAdminCharacterOptions(queryClient: QueryClient) {
  return queryClient.fetchQuery(characterOptionsQuery());
}

export function fetchAdminCharactersForReorder(
  queryClient: QueryClient,
  categoryId: number,
) {
  return queryClient.fetchQuery({
    queryKey: adminCharacterKeys.reorder(categoryId),
    queryFn: ({ signal }) =>
      fetchCharacterList(
        { active: "all", categoryId, name: "" },
        1,
        100,
        signal,
      ).then((data) => data.items),
    staleTime: 0,
  });
}

export function useCreateAdminCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      fetchAdminApiJson<CharacterListItem>("/api/v2/admin/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCharacterKeys.all }),
  });
}

export function useUpdateAdminCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      fetchAdminApiJson<CharacterListItem>(`/api/v2/admin/characters/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCharacterKeys.all }),
  });
}

export function useDeleteAdminCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAdminApiJson<CharacterListItem>(`/api/v2/admin/characters/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCharacterKeys.all }),
  });
}

export function useReorderAdminCharacters() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ categoryId, ids }: { categoryId: number; ids: number[] }) =>
      fetchAdminApiJson<CharacterListItem[]>("/api/v2/admin/characters/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, ids }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminCharacterKeys.all }),
  });
}
