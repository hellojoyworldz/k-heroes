import { AdminButton } from "@/app/(admin)/_components/admin-button";

type AdminPanelFooterProps = {
  mode: "create" | "edit";
  onCancel: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
  isDeleting?: boolean;
  deleteConfirmMessage?: string;
};

export function AdminPanelFooter({
  deleteConfirmMessage = "삭제하시겠습니까?",
  isDeleting = false,
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
        <AdminButton
          className="w-auto"
          disabled={isSaving}
          isLoading={isDeleting}
          loadingText="삭제 중..."
          onClick={handleDelete}
          size="sm"
          type="button"
          variant="danger"
        >
          삭제
        </AdminButton>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <AdminButton
          className="w-auto"
          disabled={isSaving || isDeleting}
          onClick={onCancel}
          size="sm"
          type="button"
          variant="secondary"
        >
          취소
        </AdminButton>
        <AdminButton
          className="w-auto"
          isLoading={isSaving}
          disabled={isDeleting}
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
