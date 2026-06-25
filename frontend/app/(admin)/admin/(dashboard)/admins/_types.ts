import type { AdminRole } from "@/app/(admin)/_components/admin-badge";

export type AdminUserListItem = {
  id: number;
  username: string;
  role: AdminRole;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
