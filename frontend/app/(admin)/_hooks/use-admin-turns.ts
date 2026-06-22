"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import type { ActiveFilterValue } from "@/app/(admin)/_components/admin-active-filter";
import type { AdminPageSize } from "@/app/(admin)/_components/admin-pagination";
import {
  fetchAdminApiJson,
  type PaginatedResponse,
} from "@/app/(admin)/_lib/admin-api";
import type { TurnListItem } from "@/app/(admin)/admin/(dashboard)/turns/_types";

type ChoiceWrite = {
  title: string;
  description: string;
  choice_image?: string;
  result_text: string;
  is_historical: boolean;
  turn_stats: { stat_id: number; delta: number }[];
};

type TurnWrite = {
  scenario_id: number;
  title: string;
  situation: string;
  turn_image?: string;
  tip_title: string;
  tip_desc: string;
  choices: { A: ChoiceWrite; B: ChoiceWrite };
  is_active?: boolean;
};

export type TurnFilters = {
  characterId: number | null;
  scenarioId: number | null;
  active: ActiveFilterValue;
};

export const adminTurnKeys = {
  all: ["admin", "turns"] as const,
  list: (filters: TurnFilters, page: number, pageSize: AdminPageSize) =>
    [...adminTurnKeys.all, "list", { filters, page, pageSize }] as const,
  reorder: (scenarioId: number) => [...adminTurnKeys.all, "reorder", scenarioId] as const,
};

function getTurnsPath(filters: TurnFilters, page: number, pageSize: AdminPageSize) {
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
  return `/api/v2/admin/turns?${params.toString()}`;
}

function fetchTurnList(
  filters: TurnFilters,
  page: number,
  pageSize: AdminPageSize,
  signal?: AbortSignal,
) {
  return fetchAdminApiJson<PaginatedResponse<TurnListItem>>(
    getTurnsPath(filters, page, pageSize),
    { cache: "no-store", signal },
  );
}

export function useAdminTurns(
  filters: TurnFilters,
  page: number,
  pageSize: AdminPageSize,
) {
  return useQuery({
    queryKey: adminTurnKeys.list(filters, page, pageSize),
    queryFn: ({ signal }) => fetchTurnList(filters, page, pageSize, signal),
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function fetchAdminTurnsForReorder(queryClient: QueryClient, scenarioId: number) {
  return queryClient.fetchQuery({
    queryKey: adminTurnKeys.reorder(scenarioId),
    queryFn: ({ signal }) =>
      fetchTurnList({ characterId: null, scenarioId, active: "all" }, 1, 100, signal).then(
        (data) => data.items,
      ),
    staleTime: 0,
  });
}

export function useCreateAdminTurn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: TurnWrite) =>
      fetchAdminApiJson<TurnListItem>("/api/v2/admin/turns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTurnKeys.all }),
  });
}

export function useUpdateAdminTurn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: Omit<TurnWrite, "scenario_id"> & { is_active?: boolean };
    }) =>
      fetchAdminApiJson<TurnListItem>(`/api/v2/admin/turns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTurnKeys.all }),
  });
}

export function useDeleteAdminTurn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchAdminApiJson<TurnListItem>(`/api/v2/admin/turns/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTurnKeys.all }),
  });
}

export function useReorderAdminTurns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scenarioId, ids }: { scenarioId: number; ids: number[] }) =>
      fetchAdminApiJson<TurnListItem[]>("/api/v2/admin/turns/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_id: scenarioId, ids }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminTurnKeys.all }),
  });
}
