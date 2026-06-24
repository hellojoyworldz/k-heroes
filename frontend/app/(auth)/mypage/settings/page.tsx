"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { SitePageShell } from "@/components/layout/site-page-shell";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validatePassword } from "@/lib/auth/password-policy";
import { mockUserProfile } from "@/lib/mypage/mock-data";

export default function AccountSettingsPage() {
  const router = useRouter();
  // TODO: /api/v2/auth/me 연동
  const user = mockUserProfile;
  const isLocalAccount = user.auth_provider === "local";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [newPassword, setNewPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData(event.currentTarget);
    const currentPassword = String(formData.get("current_password") ?? "").trim();
    const password = String(formData.get("new_password") ?? "");
    const passwordConfirm = String(formData.get("new_password_confirm") ?? "");

    const wantsPasswordChange = password.length > 0 || passwordConfirm.length > 0 || currentPassword.length > 0;

    if (isLocalAccount && wantsPasswordChange) {
      if (!currentPassword) {
        setErrorMessage("현재 비밀번호를 입력해 주세요.");
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setErrorMessage(passwordError);
        return;
      }

      if (password !== passwordConfirm) {
        setErrorMessage("새 비밀번호 확인이 일치하지 않습니다.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // TODO: /api/v2/auth/me PATCH 연동
      await new Promise((resolve) => setTimeout(resolve, 600));
      setErrorMessage("계정 정보 변경 API 연동 전입니다. UI만 준비된 상태입니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SitePageShell>
      <div className="mx-auto max-w-2xl px-6 py-10 sm:py-14">
        <header className="mb-8">
          <Link
            className="text-sm text-[#6B6458] transition hover:text-[#2A4232]"
            href="/mypage"
          >
            ← 마이페이지로 돌아가기
          </Link>
          <h1
            className="mt-4 text-3xl font-semibold text-[#1A1714]"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            계정 정보 변경
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6B6458]">
            이름, 이메일, 닉네임과 비밀번호를 수정할 수 있습니다.
          </p>
        </header>

        <form
          className="space-y-8 rounded-2xl border p-6 sm:p-8"
          onSubmit={handleSubmit}
          style={{
            background: "rgba(253,250,244,0.94)",
            borderColor: "rgba(42,66,50,0.12)",
          }}
        >
          <section className="space-y-5">
            <div>
              <h2
                className="text-lg font-semibold text-[#1A1714]"
                style={{ fontFamily: "'Noto Serif KR', serif" }}
              >
                기본 정보
              </h2>
              <p className="mt-1 text-xs text-[#8A847C]">아이디는 변경할 수 없습니다.</p>
            </div>

            <AuthFormField
              autoComplete="username"
              defaultValue={user.login_id ?? ""}
              disabled
              id="login_id"
              label="아이디"
              name="login_id"
              type="text"
            />

            <AuthFormField
              autoComplete="name"
              defaultValue={user.name ?? ""}
              id="name"
              label="이름"
              maxLength={100}
              name="name"
              placeholder="이름을 입력하세요"
              type="text"
            />

            <AuthFormField
              autoComplete="email"
              defaultValue={user.email ?? ""}
              id="email"
              label="이메일"
              maxLength={255}
              name="email"
              placeholder="이메일을 입력하세요"
              type="email"
            />

            <AuthFormField
              autoComplete="nickname"
              defaultValue={user.nickname ?? ""}
              id="nickname"
              label="닉네임"
              maxLength={100}
              name="nickname"
              placeholder="닉네임을 입력하세요"
              type="text"
            />
          </section>

          {isLocalAccount ? (
            <section className="space-y-5 border-t pt-8" style={{ borderColor: "rgba(42,66,50,0.08)" }}>
              <div>
                <h2
                  className="text-lg font-semibold text-[#1A1714]"
                  style={{ fontFamily: "'Noto Serif KR', serif" }}
                >
                  비밀번호 변경
                </h2>
                <p className="mt-1 text-xs text-[#8A847C]">
                  변경하지 않으려면 비밀번호 항목을 비워 두세요.
                </p>
              </div>

              <AuthFormField
                autoComplete="current-password"
                id="current_password"
                label="현재 비밀번호"
                name="current_password"
                placeholder="현재 비밀번호"
                type="password"
              />

              <AuthFormField
                autoComplete="new-password"
                id="new_password"
                label="새 비밀번호"
                maxLength={PASSWORD_MAX_LENGTH}
                minLength={PASSWORD_MIN_LENGTH}
                name="new_password"
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="새 비밀번호"
                type="password"
                value={newPassword}
              />

              {newPassword ? <PasswordRequirements password={newPassword} /> : null}

              <AuthFormField
                autoComplete="new-password"
                id="new_password_confirm"
                label="새 비밀번호 확인"
                maxLength={PASSWORD_MAX_LENGTH}
                minLength={PASSWORD_MIN_LENGTH}
                name="new_password_confirm"
                placeholder="새 비밀번호 확인"
                type="password"
              />
            </section>
          ) : (
            <p
              className="rounded-lg border px-4 py-3 text-sm text-[#6B6458]"
              style={{ borderColor: "rgba(42,66,50,0.12)", background: "rgba(42,66,50,0.03)" }}
            >
              Google 계정은 비밀번호를 이 화면에서 변경할 수 없습니다.
            </p>
          )}

          {errorMessage ? <AuthAlert message={errorMessage} /> : null}
          {successMessage ? <AuthAlert message={successMessage} variant="info" /> : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <AuthButton isLoading={isSubmitting} loadingText="저장 중..." type="submit">
              변경 사항 저장
            </AuthButton>
            <AuthButton onClick={() => router.push("/mypage")} type="button" variant="secondary">
              취소
            </AuthButton>
          </div>
        </form>
      </div>
    </SitePageShell>
  );
}
