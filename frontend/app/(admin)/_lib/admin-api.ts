export type AdminRole = "superadmin" | "admin" | "partner";

export type AdminUser = {
  id: number;
  username: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
};

export class AdminApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

const ADMIN_API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8000";

export function getAdminApiUrl(path: string) {
  return `${ADMIN_API_BASE_URL}${path}`;
}

export function fetchAdminApi(path: string, init?: RequestInit) {
  return fetch(getAdminApiUrl(path), {
    ...init,
    credentials: "include",
  });
}

export async function fetchAdminApiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetchAdminApi(path, init);

  if (!response.ok) {
    let message = "요청을 처리하지 못했습니다.";
    try {
      const data = (await response.json()) as { detail?: unknown };
      if (typeof data.detail === "string" && data.detail.trim()) message = data.detail;
    } catch {
      // JSON 오류 응답이 아니면 기본 메시지를 사용합니다.
    }
    throw new AdminApiError(response.status, message);
  }

  return (await response.json()) as T;
}
