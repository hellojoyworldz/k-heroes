import { AdminAuthGuard } from "@/app/(admin)/_components/admin-auth-guard";
import { AdminShell } from "@/app/(admin)/_components/admin-shell";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthGuard>
      <AdminShell>{children}</AdminShell>
    </AdminAuthGuard>
  );
}
