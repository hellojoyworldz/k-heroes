"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { fetchAdminApi } from "@/app/(admin)/_lib/admin-api";

export function AdminAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function verifySession() {
      try {
        const response = await fetchAdminApi("/api/v2/admin/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          router.replace("/admin/login");
        }
      }
    }

    void verifySession();
    return () => controller.abort();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAF8] text-sm text-[#8A847C]">
        로그인 상태를 확인하고 있습니다.
      </div>
    );
  }

  return children;
}
