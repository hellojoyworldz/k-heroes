"use client";

import { useMemo, useState } from "react";
import { AdminInput } from "@/app/(admin)/_components/admin-input";

type AdminImageUrlFieldProps = {
  className?: string;
  defaultValue?: string;
  id?: string;
  maxLength?: number;
  name: string;
  placeholder?: string;
  previewAlt?: string;
};

const embedBlockedMessage =
  "미리보기를 불러오지 못했습니다. 이미지 서버가 외부 사이트 임베드를 막았을 수 있습니다.";

function getMixedContentWarning(url: string): string | null {
  if (typeof window === "undefined" || window.location.protocol !== "https:") {
    return null;
  }

  try {
    return new URL(url).protocol === "http:" ? embedBlockedMessage : null;
  } catch {
    return null;
  }
}

export function AdminImageUrlField({
  className,
  defaultValue = "",
  id,
  maxLength,
  name,
  placeholder = "https://",
  previewAlt = "이미지 미리보기",
}: AdminImageUrlFieldProps) {
  const [imageUrl, setImageUrl] = useState(defaultValue);
  const [hasError, setHasError] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  const trimmedUrl = imageUrl.trim();
  const showPreview = trimmedUrl.length > 0;
  const mixedContentWarning = useMemo(
    () => (showPreview ? getMixedContentWarning(trimmedUrl) : null),
    [showPreview, trimmedUrl],
  );

  function handleUrlChange(value: string) {
    setImageUrl(value);
    setHasError(false);
    setPreviewKey((current) => current + 1);
  }

  return (
    <div className="space-y-3">
      <AdminInput
        className={className}
        id={id}
        maxLength={maxLength}
        name={name}
        onChange={(event) => handleUrlChange(event.target.value)}
        placeholder={placeholder}
        type="url"
        value={imageUrl}
      />

      {showPreview ? (
        mixedContentWarning || hasError ? (
          <ImagePreviewFallback href={trimmedUrl} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={`${trimmedUrl}-${previewKey}`}
              alt={previewAlt}
              className="mx-auto max-h-48 w-full object-contain"
              onError={() => setHasError(true)}
              onLoad={() => setHasError(false)}
              referrerPolicy="no-referrer"
              src={trimmedUrl}
            />
          </div>
        )
      ) : null}
    </div>
  );
}

function ImagePreviewFallback({ href }: { href: string }) {
  return (
    <div className="space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-5 text-center text-sm text-[#8A847C]">
      <p>{embedBlockedMessage}</p>
      <a
        className="text-[#2A4232] underline underline-offset-2 hover:text-[#1A1714]"
        href={href}
        rel="noreferrer"
        target="_blank"
      >
        새 탭에서 이미지 열기
      </a>
    </div>
  );
}
