import { AdminFormRow, AdminFormTable } from "@/app/(admin)/_components/admin-form-row";
import { AdminInput } from "@/app/(admin)/_components/admin-input";
import { AdminTextarea } from "@/app/(admin)/_components/admin-textarea";

export type CharacterCategoryFormItem = {
  id: number;
  title: string;
  description: string;
  is_active: boolean;
};

type CharacterCategoryPanelFormProps = {
  mode: "create" | "edit";
  category?: CharacterCategoryFormItem;
};

const panelInputClassName =
  "h-11 rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

const panelTextareaClassName =
  "min-h-[100px] rounded-lg border-[#D6D0C6] bg-white text-sm focus:border-[#2A4232] focus:ring-4 focus:ring-[#2A4232]/10";

export function CharacterCategoryPanelForm({ category, mode }: CharacterCategoryPanelFormProps) {
  const isCreate = mode === "create";

  return (
    <AdminFormTable>
      {!isCreate ? (
        <AdminFormRow htmlFor="category-id" label="ID">
          <AdminInput
            className={panelInputClassName}
            defaultValue={category?.id}
            disabled
            id="category-id"
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
              defaultChecked={category?.is_active ?? true}
              name="is_active"
              type="checkbox"
            />
            사용
          </label>
        </AdminFormRow>
      ) : null}

      <AdminFormRow htmlFor="category-title" label="카테고리명" required>
        <AdminInput
          className={panelInputClassName}
          defaultValue={category?.title}
          id="category-title"
          maxLength={100}
          name="title"
          placeholder="예: 정치 / 외교"
          required
          type="text"
        />
      </AdminFormRow>

      <AdminFormRow alignTop htmlFor="category-description" label="설명" required={isCreate}>
        <AdminTextarea
          className={panelTextareaClassName}
          defaultValue={category?.description}
          id="category-description"
          name="description"
          placeholder="카테고리 설명을 입력하세요"
          required={isCreate}
        />
      </AdminFormRow>
    </AdminFormTable>
  );
}
