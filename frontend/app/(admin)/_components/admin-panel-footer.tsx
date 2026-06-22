import { AdminButton } from "@/app/(admin)/_components/admin-button";

type AdminPanelFooterProps = {
  mode: "create" | "edit";
  onCancel: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  deleteConfirmMessage?: string;
};

export function AdminPanelFooter({
  deleteConfirmMessage = "삭제하시겠습니까?",
  isSaving = false,
  mode,
  onCancel,
  onDelete,
  onSave,
}: AdminPanelFooterProps) {
  function handleDelete() {
    if (!window.confirm(deleteConfirmMessage)) {
      return;
    }

    onDelete?.();
  }

  return (
    <div className="flex items-center justify-between gap-3">
      {mode === "edit" ? (
        <AdminButton className="w-auto" onClick={handleDelete} size="sm" type="button" variant="danger">
          삭제
        </AdminButton>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <AdminButton className="w-auto" onClick={onCancel} size="sm" type="button" variant="secondary">
          취소
        </AdminButton>
        <AdminButton
          className="w-auto"
          isLoading={isSaving}
          loadingText="저장 중..."
          onClick={onSave}
          size="sm"
          type="button"
        >
          저장
        </AdminButton>
      </div>
    </div>
  );
}
