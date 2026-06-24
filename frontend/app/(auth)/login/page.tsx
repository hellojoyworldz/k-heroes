"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { AuthFormCard, AuthFormLayout } from "@/components/layout/auth-form-layout";

function LoginForm() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const signupSuccess = searchParams.get("signup") === "success";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      // TODO: /api/v2/auth/session 연동
      await new Promise((resolve) => setTimeout(resolve, 600));
      setErrorMessage("로그인 API 연동 전입니다. UI만 준비된 상태입니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleLogin() {
    setErrorMessage("구글 로그인은 API 연동 후 사용할 수 있습니다.");
  }

  return (
    <AuthFormLayout>
      <AuthFormCard
        description="가입한 계정으로 로그인하고 나의 시뮬레이션 기록을 이어가세요."
        footer={
          <p className="text-center text-sm text-[#6B6458]">
            아직 계정이 없으신가요?{" "}
            <Link className="font-medium text-[#2A4232] underline-offset-4 hover:underline" href="/signup">
              회원가입
            </Link>
          </p>
        }
        title="로그인"
      >
        {signupSuccess ? (
          <div className="mb-5">
            <AuthAlert message="회원가입이 완료되었습니다. 로그인해 주세요." variant="info" />
          </div>
        ) : null}

        <form className="space-y-5" noValidate onSubmit={handleSubmit}>
          <AuthFormField
            autoComplete="username"
            id="login_id"
            label="아이디"
            name="login_id"
            placeholder="아이디를 입력하세요"
            required
            type="text"
          />

          <AuthFormField
            autoComplete="current-password"
            showPasswordToggle
            id="password"
            label="비밀번호"
            minLength={8}
            name="password"
            placeholder="비밀번호를 입력하세요"
            required
            type="password"
          />

          {errorMessage ? <AuthAlert message={errorMessage} /> : null}

          <AuthButton isLoading={isSubmitting} loadingText="로그인 중..." type="submit">
            로그인
          </AuthButton>
        </form>

        <AuthDivider />

        <GoogleLoginButton onClick={handleGoogleLogin} />
      </AuthFormCard>
    </AuthFormLayout>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
