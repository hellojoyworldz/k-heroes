import { keepPreviousData } from "@tanstack/react-query";

/** 목록 쿼리 메모리 유지 시간 (10분) */
export const ADMIN_LIST_GC_TIME = 10 * 60 * 1000;

/**
 * 어드민 목록 조회용 SWR(stale-while-revalidate) 옵션.
 * - 캐시가 있으면 즉시 표시 후 백그라운드에서 재조회
 * - 캐시가 없으면 isPending으로 초기 로딩 표시
 */
export const adminListQueryOptions = {
  staleTime: 0,
  gcTime: ADMIN_LIST_GC_TIME,
  placeholderData: keepPreviousData,
} as const;
