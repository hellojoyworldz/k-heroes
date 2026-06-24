export type AuthApiErrorDetail = {
  detail?: unknown;
};

export class AuthApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

const AUTH_API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export function getAuthApiUrl(path: string) {
  return `${AUTH_API_BASE_URL}${path}`;
}

function extractErrorMessage(detail: unknown) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail)) {
    const firstMessage = detail
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const candidate = (item as { msg?: unknown }).msg;
        return typeof candidate === "string" && candidate.trim() ? candidate : null;
      })
      .find((message): message is string => Boolean(message));

    if (firstMessage) {
      return firstMessage;
    }
  }

  return "요청을 처리하지 못했습니다.";
}

export async function fetchAuthApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(getAuthApiUrl(path), {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
    let message = "요청을 처리하지 못했습니다.";

    try {
      const data = (await response.json()) as AuthApiErrorDetail;
      message = extractErrorMessage(data.detail);
    } catch {
      // JSON 오류 응답이 아니면 기본 메시지를 사용합니다.
    }

    throw new AuthApiError(response.status, message);
  }

  return (await response.json()) as T;
}
