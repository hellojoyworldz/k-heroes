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
