"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthMe } from "@/hooks/use-auth-me";

export function useGuestOnlyRedirect(redirectTo = "/") {
  const router = useRouter();
  const authMeQuery = useAuthMe();

  useEffect(() => {
    if (authMeQuery.data) {
      router.replace(redirectTo);
    }
  }, [authMeQuery.data, redirectTo, router]);

  return {
    isCheckingAuth: authMeQuery.isLoading || Boolean(authMeQuery.data),
  };
}
