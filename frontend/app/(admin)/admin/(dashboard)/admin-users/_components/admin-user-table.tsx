import { AdminRoleBadge, AdminStatusBadge } from "@/app/(admin)/_components/admin-badge";
import {
  AdminDataTable,
  AdminTableCell,
  AdminTableRow,
  type AdminTableColumn,
} from "@/app/(admin)/_components/admin-data-table";
import type { AdminUserListItem } from "@/app/(admin)/admin/(dashboard)/admin-users/_types";

const columns: AdminTableColumn[] = [
  { key: "id", header: "ID", className: "w-16" },
  { key: "username", header: "아이디", className: "w-36" },
  { key: "role", header: "역할", className: "w-32" },
  { key: "status", header: "상태", className: "w-24" },
  { key: "last_login", header: "마지막 로그인", className: "w-56" },
  { key: "created_at", header: "생성일", className: "w-32" },
];

const dateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
  timeStyle: "short",
});

const dateFormatter = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
});

function formatDate(value: string, includeTime = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return (includeTime ? dateTimeFormatter : dateFormatter).format(date);
}

type AdminUserTableProps = {
  users: AdminUserListItem[];
  errorMessage?: string;
  isLoading?: boolean;
  onRowClick: (user: AdminUserListItem) => void;
  onRetry?: () => void;
};

export function AdminUserTable({
  errorMessage,
  isLoading,
  onRetry,
  onRowClick,
  users,
}: AdminUserTableProps) {
  return (
    <AdminDataTable
      columns={columns}
      emptyMessage="등록된 어드민이 없습니다."
      errorMessage={errorMessage}
      isEmpty={users.length === 0}
      isLoading={isLoading}
      loadingMessage="어드민 목록을 불러오고 있습니다."
      onRetry={onRetry}
    >
      {users.map((user) => (
        <AdminTableRow key={user.id} onClick={() => onRowClick(user)}>
          <AdminTableCell className="text-[#8A847C]">{user.id}</AdminTableCell>
          <AdminTableCell className="max-w-36 truncate font-medium text-[#1A1714]">
            {user.username}
          </AdminTableCell>
          <AdminTableCell>
            <AdminRoleBadge role={user.role} />
          </AdminTableCell>
          <AdminTableCell>
            <AdminStatusBadge isActive={user.is_active} />
          </AdminTableCell>
          <AdminTableCell className="whitespace-nowrap text-[#8A847C]">
            {user.last_login_at ? formatDate(user.last_login_at, true) : "—"}
          </AdminTableCell>
          <AdminTableCell className="text-[#8A847C]">
            {formatDate(user.created_at)}
          </AdminTableCell>
        </AdminTableRow>
      ))}
    </AdminDataTable>
  );
}
