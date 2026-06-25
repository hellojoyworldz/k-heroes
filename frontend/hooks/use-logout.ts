"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { authMeQueryKey } from "@/hooks/use-auth-me";
import { getAuthApiUrl } from "@/lib/auth/auth-api";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const response = await fetch(getAuthApiUrl("/api/v2/auth/session/logout"), {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("logout failed");
      }

      queryClient.setQueryData(authMeQueryKey, null);
      router.replace("/");
      router.refresh();
    } catch {
      setLogoutDialogOpen(true);
      setIsLoggingOut(false);
    }
  }

  return {
    handleLogout,
    isLoggingOut,
    logoutDialogOpen,
    setLogoutDialogOpen,
  };
}
