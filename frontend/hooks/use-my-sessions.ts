"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchAuthApiJson } from "@/lib/auth/auth-api";
import type { PlaySessionListResponse } from "@/lib/auth/types";

export type MySessionsParams = {
  page: number;
  pageSize: number;
  dateFrom?: string;
  dateTo?: string;
  characterName?: string;
  scenarioTitle?: string;
};

export const authSessionsQueryKeyPrefix = ["auth", "sessions"] as const;

export function mySessionsQueryKey(params: MySessionsParams) {
  return [...authSessionsQueryKeyPrefix, params] as const;
}

function buildSessionsQueryString(params: MySessionsParams) {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });

  if (params.dateFrom) searchParams.set("date_from", params.dateFrom);
  if (params.dateTo) searchParams.set("date_to", params.dateTo);
  if (params.characterName) searchParams.set("character_name", params.characterName);
  if (params.scenarioTitle) searchParams.set("scenario_title", params.scenarioTitle);

  return searchParams.toString();
}

async function fetchMySessions(params: MySessionsParams) {
  const queryString = buildSessionsQueryString(params);
  return fetchAuthApiJson<PlaySessionListResponse>(`/api/v2/auth/sessions?${queryString}`);
}

export function useMySessions(params: MySessionsParams, enabled = true) {
  return useQuery({
    queryKey: mySessionsQueryKey(params),
    queryFn: () => fetchMySessions(params),
    enabled,
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}
