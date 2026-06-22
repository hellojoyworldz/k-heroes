"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ActiveFilterValue } from "@/app/(admin)/_components/admin-active-filter";
import type { AdminPageSize } from "@/app/(admin)/_components/admin-pagination";
import {
  fetchAdminApiJson,
  type PaginatedResponse,
} from "@/app/(admin)/_lib/admin-api";
import type { ScenarioListItem } from "@/app/(admin)/admin/(dashboard)/scenarios/_types";

type ScenarioWrite = {
  character_id: number;
  title: string;
  description: string;
  historical_facts: string;
  source_story_ids: number[];
  is_active?: boolean;
};

type ScenarioFilters = {
  active: ActiveFilterValue;
  characterId: number | null;
};

export const adminScenarioKeys = {
  all: ["admin", "scenarios"] as const,
  list: (filters: ScenarioFilters, page: number, pageSize: AdminPageSize) =>
    [...adminScenarioKeys.all, "list", { filters, page, pageSize }] as const,
  reorder: (characterId: number) => [...adminScenarioKeys.all, "reorder", characterId] as const,
};

function getScenariosPath(
  filters: ScenarioFilters,
  page: number,
  pageSize: AdminPageSize,
) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (filters.characterId !== null) {
    params.set("character_id", String(filters.characterId));
  }
  if (filters.active === "active") {
    params.set("is_active", "true");
  }
  if (filters.active === "inactive") {
    params.set("is_active", "false");
  }
  return `/api/v2/admin/scenarios?${params.toString()}`;
}

function fetchScenarioList(
  filters: ScenarioFilters,
  page: number,
  pageSize: AdminPageSize,
  signal?: AbortSignal,
) {
  return fetchAdminApiJson<PaginatedResponse<ScenarioListItem>>(
    getScenariosPath(filters, page, pageSize),
    { cache: "no-store", signal },
  );
}

export function useAdminScenarios(
  filters: ScenarioFilters,
  page: number,
  pageSize: AdminPageSize,
) {
  return useQuery({
    queryKey: adminScenarioKeys.list(filters, page, pageSize),
    queryFn: ({ signal }) => fetchScenarioList(filters, page, pageSize, signal),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function fetchAdminScenariosForReorder(
  queryClient: QueryClient,
  characterId: number,
) {
  return queryClient.fetchQuery({
    queryKey: adminScenarioKeys.reorder(characterId),
    queryFn: ({ signal }) =>
      fetchScenarioList(
        { active: "all", characterId },
        1,
        100,
        signal,
      ).then((data) => data.items),
    staleTime: 0,
  });
}

export function useCreateAdminScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: ScenarioWrite) =>
      fetchAdminApiJson<ScenarioListItem>("/api/v2/admin/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminScenarioKeys.all }),
  });
}

export function useUpdateAdminScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Partial<ScenarioWrite> & { is_active?: boolean } }) =>
      fetchAdminApiJson<ScenarioListItem>(`/api/v2/admin/scenarios/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminScenarioKeys.all }),
  });
}

export function useDeleteAdminScenario() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAdminApiJson<ScenarioListItem>(`/api/v2/admin/scenarios/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminScenarioKeys.all }),
  });
}

export function useReorderAdminScenarios() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ characterId, ids }: { characterId: number; ids: number[] }) =>
      fetchAdminApiJson<ScenarioListItem[]>("/api/v2/admin/scenarios/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ character_id: characterId, ids }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminScenarioKeys.all }),
  });
}
