import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AdminSlidePanelProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AdminSlidePanel({
  children,
  description,
  footer,
  onClose,
  open,
  title,
}: AdminSlidePanelProps) {
  return (
    <>
      <div
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-40 cursor-pointer bg-black/30 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
      />

      <aside
        aria-hidden={!open}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-2xl flex-col border-l border-[#E8E4DC] bg-white shadow-2xl transition-transform duration-200",
          open ? "translate-x-0" : "pointer-events-none translate-x-full",
        )}
      >
        <div className="flex items-start justify-between border-b border-[#E8E4DC] px-6 py-5">
          <div>
            <h2
              className="text-lg font-semibold text-[#1A1714]"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-[#8A847C]">{description}</p> : null}
          </div>
          <button
            aria-label="닫기"
            className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#8A847C] hover:bg-[#F4F1EA] hover:text-[#3A3530]"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer ? (
          <div className="border-t border-[#E8E4DC] px-6 py-4">{footer}</div>
        ) : null}
      </aside>
    </>
  );
}
