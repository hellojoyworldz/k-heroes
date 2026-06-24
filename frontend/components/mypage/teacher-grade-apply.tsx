"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TeacherGradeApplyDialogProps = {
  disabled?: boolean;
};

export function TeacherGradeApplyDialog({ disabled = false }: TeacherGradeApplyDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"confirm" | "done">("confirm");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setStep("confirm");
      setIsSubmitting(false);
    }
  }

  async function handleConfirm() {
    setIsSubmitting(true);

    try {
      // TODO: 지도자 등급 변경 신청 API 연동
      await new Promise((resolve) => setTimeout(resolve, 500));
      setStep("done");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <AuthButton
        disabled={disabled}
        onClick={() => setOpen(true)}
        size="sm"
        type="button"
        variant="secondary"
      >
        지도자 등급 변경 신청
      </AuthButton>

      <Dialog onOpenChange={handleOpenChange} open={open}>
        <DialogContent
          className="border-[rgba(42,66,50,0.12)] bg-[#FDFAF4] sm:max-w-md"
          style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          {step === "confirm" ? (
            <>
              <DialogHeader>
                <DialogTitle
                  className="text-[#1A1714]"
                  style={{ fontFamily: "'Noto Serif KR', serif" }}
                >
                  지도자 등급 변경 신청
                </DialogTitle>
                <DialogDescription className="text-left text-sm leading-relaxed text-[#6B6458]">
                  학생 계정을 지도자(교사) 계정으로 변경 신청하시겠습니까?
                  <br />
                  <br />
                  신청 후 관리자 검토를 거쳐 승인되면 클래스 개설, 학생 관리 등 지도자
                  기능을 사용할 수 있습니다.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="grid gap-3 sm:grid-cols-2">
                <AuthButton
                  disabled={isSubmitting}
                  onClick={() => setOpen(false)}
                  type="button"
                  variant="secondary"
                >
                  취소
                </AuthButton>
                <AuthButton isLoading={isSubmitting} loadingText="신청 중..." onClick={handleConfirm} type="button">
                  신청하기
                </AuthButton>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle
                  className="text-[#1A1714]"
                  style={{ fontFamily: "'Noto Serif KR', serif" }}
                >
                  접수 완료
                </DialogTitle>
                <DialogDescription className="text-left text-sm leading-relaxed text-[#6B6458]">
                  지도자 등급 변경 신청이 접수되었습니다.
                  <br />
                  <br />
                  관리자 승인까지 <strong className="font-medium text-[#2A4232]">2~3일</strong> 정도
                  소요될 수 있습니다. 승인 결과는 로그인 후 마이페이지에서 확인할 수 있습니다.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter>
                <AuthButton className="w-full" onClick={() => setOpen(false)} type="button">
                  확인
                </AuthButton>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
