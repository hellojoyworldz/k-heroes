import type { ReactNode } from "react";

type AdminPageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function AdminPageHeader({ action, description, title }: AdminPageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1
          className="text-2xl font-semibold text-[#1A1714]"
          style={{ fontFamily: "'Noto Serif KR', serif" }}
        >
          {title}
        </h1>
        {description ? <p className="mt-1.5 text-sm text-[#8A847C]">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
