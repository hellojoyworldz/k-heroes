"use client";

import { useQuery } from "@tanstack/react-query";
import { getAuthApiUrl } from "@/lib/auth/auth-api";
import type { UserProfile } from "@/lib/auth/types";

export const authMeQueryKey = ["auth", "me"] as const;

type UserProfileResponse = UserProfile & {
  provider_user_id?: string | null;
};

export function toUserProfile(user: UserProfileResponse): UserProfile {
  return {
    id: user.id,
    auth_provider: user.auth_provider,
    login_id: user.login_id,
    name: user.name,
    email: user.email,
    nickname: user.nickname,
    grade: user.grade,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function fetchCurrentUser(): Promise<UserProfile | null> {
  const response = await fetch(getAuthApiUrl("/api/v2/auth/me"), {
    credentials: "include",
  });

  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (!response.ok) {
    throw new Error("현재 회원 정보를 불러오지 못했습니다.");
  }

  return toUserProfile((await response.json()) as UserProfileResponse);
}

export function useAuthMe() {
  return useQuery({
    queryKey: authMeQueryKey,
    queryFn: fetchCurrentUser,
    retry: false,
    staleTime: 0,
  });
}
