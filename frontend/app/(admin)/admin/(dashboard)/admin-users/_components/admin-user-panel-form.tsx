import { AdminFormRow, AdminFormTable } from "@/app/(admin)/_components/admin-form-row";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminSelect } from "@/app/(admin)/_components/admin-select";
import type { AdminUserListItem } from "@/app/(admin)/admin/(dashboard)/admin-users/_types";

type AdminUserPanelFormProps = {
  mode: "create" | "edit";
  user?: AdminUserListItem;
};

const panelInputClassName =
  "h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

export function AdminUserPanelForm({ mode, user }: AdminUserPanelFormProps) {
  const isCreate = mode === "create";

  return (
    <AdminFormTable>
      {!isCreate ? (
        <AdminFormRow htmlFor="admin-id" label="ID">
          <AdminInput
            className={panelInputClassName}
            defaultValue={user?.id}
            disabled
            id="admin-id"
            name="id"
            readOnly
            type="text"
          />
        </AdminFormRow>
      ) : null}

      {!isCreate ? (
        <AdminFormRow label="상태">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#3A3530]">
            <input
              className="size-4 rounded border-[#D6D0C6] accent-[#2A4232]"
              defaultChecked={user?.is_active ?? true}
              name="is_active"
              type="checkbox"
            />
            활성 계정
          </label>
        </AdminFormRow>
      ) : null}

      <AdminFormRow htmlFor="admin-username" label="아이디" required={isCreate}>
        <AdminInput
          className={panelInputClassName}
          defaultValue={user?.username}
          disabled={!isCreate}
          id="admin-username"
          maxLength={50}
          name="username"
          placeholder="아이디를 입력하세요"
          required={isCreate}
          type="text"
        />
      </AdminFormRow>

      <AdminFormRow
        htmlFor="admin-password"
        label={isCreate ? "비밀번호" : "비밀번호 변경"}
        required={isCreate}
      >
        <AdminInput
          className={panelInputClassName}
          id="admin-password"
          minLength={8}
          maxLength={128}
          name="password"
          placeholder={isCreate ? "8자 이상 입력" : "변경 시에만 입력"}
          required={isCreate}
          type="password"
        />
      </AdminFormRow>

      <AdminFormRow htmlFor="admin-role" label="역할" required>
        <AdminSelect
          className={`${panelInputClassName} h-11`}
          defaultValue={user?.role ?? "admin"}
          id="admin-role"
          name="role"
          required
        >
          <option value="superadmin">최고 관리자</option>
          <option value="admin">관리자</option>
          <option value="partner">파트너</option>
        </AdminSelect>
      </AdminFormRow>
    </AdminFormTable>
  );
}
