"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { AuthFormCard, AuthFormLayout } from "@/components/layout/auth-form-layout";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validatePassword } from "@/lib/auth/password-policy";
import { site } from "@/lib/site";

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [password, setPassword] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordConfirm = String(formData.get("password_confirm") ?? "");

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrorMessage(passwordError);
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage("서비스 이용약관 및 개인정보 처리방침에 동의해 주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: /api/v2/auth/signup 연동
      await new Promise((resolve) => setTimeout(resolve, 600));
      setErrorMessage("회원가입 API 연동 전입니다. UI만 준비된 상태입니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleSignup() {
    setErrorMessage("구글 회원가입은 API 연동 후 사용할 수 있습니다.");
  }

  return (
    <AuthFormLayout>
      <AuthFormCard
        description={`간단한 정보를 입력하고 ${site.name}의 역사 시뮬레이션을 시작해 보세요.`}
        footer={
          <p className="text-center text-sm text-[#6B6458]">
            이미 계정이 있으신가요?{" "}
            <Link className="font-medium text-[#2A4232] underline-offset-4 hover:underline" href="/login">
              로그인
            </Link>
          </p>
        }
        title="회원가입"
      >
        <form className="space-y-5" onSubmit={handleSubmit}>
          <AuthFormField
            autoComplete="username"
            hint="영문, 숫자 조합 4~50자"
            id="login_id"
            label="아이디"
            maxLength={50}
            minLength={4}
            name="login_id"
            placeholder="사용할 아이디를 입력하세요"
            required
            type="text"
          />

          <AuthFormField
            autoComplete="new-password"
            id="password"
            label="비밀번호"
            maxLength={PASSWORD_MAX_LENGTH}
            minLength={PASSWORD_MIN_LENGTH}
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호를 입력하세요"
            required
            type="password"
            value={password}
          />

          <PasswordRequirements password={password} />

          <AuthFormField
            autoComplete="new-password"
            id="password_confirm"
            label="비밀번호 확인"
            maxLength={PASSWORD_MAX_LENGTH}
            minLength={PASSWORD_MIN_LENGTH}
            name="password_confirm"
            placeholder="비밀번호를 다시 입력하세요"
            required
            type="password"
          />

          <AuthFormField
            autoComplete="name"
            id="name"
            label="이름"
            name="name"
            placeholder="이름 (선택)"
            type="text"
          />

          <AuthFormField
            autoComplete="nickname"
            id="nickname"
            label="닉네임"
            name="nickname"
            placeholder="닉네임 (선택)"
            type="text"
          />

          <AuthFormField
            autoComplete="email"
            id="email"
            label="이메일"
            name="email"
            placeholder="이메일 (선택)"
            type="email"
          />

          <label className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm text-[#4A4438]" style={{ borderColor: "rgba(42,66,50,0.12)" }}>
            <input
              checked={agreedToTerms}
              className="mt-0.5 size-4 rounded border-[rgba(42,66,50,0.25)] text-[#2A4232] focus:ring-[#3D6B52]/20"
              onChange={(event) => setAgreedToTerms(event.target.checked)}
              type="checkbox"
            />
            <span>
              <Link
                className="font-medium text-[#2A4232] underline-offset-4 hover:underline"
                href="/terms"
                rel="noopener noreferrer"
                target="_blank"
              >
                서비스 이용약관
              </Link>
              {" 및 "}
              <Link
                className="font-medium text-[#2A4232] underline-offset-4 hover:underline"
                href="/privacy"
                rel="noopener noreferrer"
                target="_blank"
              >
                개인정보 처리방침
              </Link>
              에 동의합니다.
            </span>
          </label>

          {errorMessage ? <AuthAlert message={errorMessage} /> : null}

          <AuthButton isLoading={isSubmitting} loadingText="가입 중..." type="submit">
            회원가입
          </AuthButton>
        </form>

        <AuthDivider />

        <GoogleLoginButton label="Google로 가입하기" onClick={handleGoogleSignup} />
      </AuthFormCard>
    </AuthFormLayout>
  );
}
