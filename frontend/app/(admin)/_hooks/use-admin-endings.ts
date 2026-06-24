"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ActiveFilterValue } from "@/app/(admin)/_components/admin-active-filter";
import type { AdminPageSize } from "@/app/(admin)/_components/admin-pagination";
import {
  fetchAdminApiJson,
  type PaginatedResponse,
} from "@/app/(admin)/_lib/admin-api";
import { adminListQueryOptions } from "@/app/(admin)/_lib/admin-query-config";
import type {
  EndingListItem,
  RecommendedPlace,
  SummaryItem,
} from "@/app/(admin)/admin/(dashboard)/endings/_types";

type EndingWrite = {
  scenario_id: number;
  path_key: string;
  ending_type: string;
  title: string;
  history_fact: string;
  story_headline: string;
  story_contents: string;
  factual_contents?: string;
  image_url?: string;
  summary_items: SummaryItem[];
  recommended_places: RecommendedPlace[];
  is_active?: boolean;
};

export type EndingFilters = {
  characterId: number | null;
  scenarioId: number | null;
  active: ActiveFilterValue;
};

export const adminEndingKeys = {
  all: ["admin", "endings"] as const,
  list: (filters: EndingFilters, page: number, pageSize: AdminPageSize) =>
    [...adminEndingKeys.all, "list", { filters, page, pageSize }] as const,
  reorder: (scenarioId: number) => [...adminEndingKeys.all, "reorder", scenarioId] as const,
};

function getEndingsPath(filters: EndingFilters, page: number, pageSize: AdminPageSize) {
  const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
  if (filters.characterId !== null) {
    params.set("character_id", String(filters.characterId));
  }
  if (filters.scenarioId !== null) {
    params.set("scenario_id", String(filters.scenarioId));
  }
  if (filters.active === "active") {
    params.set("is_active", "true");
  }
  if (filters.active === "inactive") {
    params.set("is_active", "false");
  }
  return `/api/v2/admin/endings?${params.toString()}`;
}

function fetchEndingList(
  filters: EndingFilters,
  page: number,
  pageSize: AdminPageSize,
  signal?: AbortSignal,
) {
  return fetchAdminApiJson<PaginatedResponse<EndingListItem>>(
    getEndingsPath(filters, page, pageSize),
    { cache: "no-store", signal },
  );
}

export function useAdminEndings(
  filters: EndingFilters,
  page: number,
  pageSize: AdminPageSize,
) {
  return useQuery({
    queryKey: adminEndingKeys.list(filters, page, pageSize),
    queryFn: ({ signal }) => fetchEndingList(filters, page, pageSize, signal),
    ...adminListQueryOptions,
  });
}

export function fetchAdminEndingsForReorder(queryClient: QueryClient, scenarioId: number) {
  return queryClient.fetchQuery({
    queryKey: adminEndingKeys.reorder(scenarioId),
    queryFn: ({ signal }) =>
      fetchEndingList({ characterId: null, scenarioId, active: "all" }, 1, 100, signal).then(
        (data) => data.items,
      ),
    staleTime: 0,
  });
}

export function useCreateAdminEnding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: EndingWrite) =>
      fetchAdminApiJson<EndingListItem>("/api/v2/admin/endings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEndingKeys.all }),
  });
}

export function useUpdateAdminEnding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: EndingWrite;
    }) =>
      fetchAdminApiJson<EndingListItem>(`/api/v2/admin/endings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEndingKeys.all }),
  });
}

export function useDeleteAdminEnding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAdminApiJson<EndingListItem>(`/api/v2/admin/endings/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEndingKeys.all }),
  });
}

export function useReorderAdminEndings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scenarioId, ids }: { scenarioId: number; ids: number[] }) =>
      fetchAdminApiJson<EndingListItem[]>("/api/v2/admin/endings/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_id: scenarioId, ids }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminEndingKeys.all }),
  });
}
