"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { adminNavGroups, isAdminNavActive } from "@/app/(admin)/_lib/admin-nav";
import { fetchAdminApi } from "@/app/(admin)/_lib/admin-api";
import { cn } from "@/lib/utils/cn";

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetchAdminApi("/api/v2/admin/auth/session/logout", { method: "POST" });
    } finally {
      queryClient.clear();
      onMobileClose();
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <>
      {mobileOpen ? (
        <button
          aria-label="메뉴 닫기"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onMobileClose}
          type="button"
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#E8E4DC] bg-white transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-[#E8E4DC] px-5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-[#2A4232]">
            <Image
              alt=""
              className="brightness-0 invert"
              height={20}
              src="/logo.svg"
              width={18}
            />
          </div>
          <div>
            <p
              className="text-sm font-semibold text-[#1A1714]"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              K-Heroes
            </p>
            <p className="text-xs text-[#8A847C]">Admin</p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {adminNavGroups.map((group) => (
            <div key={group.label} className="mb-5 last:mb-0">
              <p className="mb-2 px-3 text-xs font-medium tracking-wide text-[#8A847C]">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isAdminNavActive(pathname, item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-[#2A4232] text-white"
                            : "text-[#3A3530] hover:bg-[#F4F1EA]",
                        )}
                        href={item.href}
                        onClick={onMobileClose}
                      >
                        <Icon aria-hidden="true" className="size-[1.05rem] shrink-0" />
                        {item.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-[#E8E4DC] p-3">
          <button
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#8A847C] transition-colors hover:bg-[#F4F1EA] hover:text-[#3A3530]"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            <LogOut aria-hidden="true" className="size-[1.05rem]" />
            {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      </aside>
    </>
  );
}
