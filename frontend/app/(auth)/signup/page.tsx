"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { AuthButton } from "@/components/auth/auth-button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthFormField } from "@/components/auth/auth-form-field";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { AuthFormCard, AuthFormLayout } from "@/components/layout/auth-form-layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AuthApiError, fetchAuthApiJson } from "@/lib/auth/auth-api";
import { EMAIL_MAX_LENGTH, validateOptionalEmail } from "@/lib/auth/email-policy";
import { LOGIN_ID_MAX_LENGTH, LOGIN_ID_MIN_LENGTH, validateLoginId } from "@/lib/auth/login-id-policy";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, validatePassword } from "@/lib/auth/password-policy";
import { site } from "@/lib/site";

type SubmitDialogFocusTarget = "login_id" | "email" | null;

function getSignupErrorFocusTarget(message: string): SubmitDialogFocusTarget {
  if (message.includes("login_id")) return "login_id";
  if (message.includes("email")) return "email";
  return null;
}

function getSignupErrorMessage(message: string) {
  return message.replaceAll("login_id", "아이디").replaceAll("email", "이메일");
}

export default function SignupPage() {
  const router = useRouter();
  const loginIdInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const passwordConfirmInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState("");
  const [password, setPassword] = useState("");
  const [loginId, setLoginId] = useState("");
  const [loginIdError, setLoginIdError] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordConfirmError, setPasswordConfirmError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitDialogMessage, setSubmitDialogMessage] = useState("");
  const [submitDialogFocusTarget, setSubmitDialogFocusTarget] = useState<SubmitDialogFocusTarget>(null);

  function handleLoginIdChange(value: string) {
    setLoginId(value);
    setLoginIdError(validateLoginId(value) ?? "");
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    setPasswordError(validatePassword(value) ?? "");

    if (passwordConfirm) {
      setPasswordConfirmError(value === passwordConfirm ? "" : "비밀번호가 일치하지 않습니다.");
    }
  }

  function handlePasswordConfirmChange(value: string) {
    setPasswordConfirm(value);
    setPasswordConfirmError(password === value ? "" : "비밀번호가 일치하지 않습니다.");
  }

  function handleEmailChange(value: string) {
    setEmail(value);
    setEmailError(validateOptionalEmail(value) ?? "");
  }

  function focusField(target: SubmitDialogFocusTarget) {
    if (target === "login_id") {
      loginIdInputRef.current?.focus();
      return;
    }

    if (target === "email") {
      emailInputRef.current?.focus();
    }
  }

  function openSubmitDialog(message: string, focusTarget: SubmitDialogFocusTarget = null) {
    setSubmitDialogMessage(message);
    setSubmitDialogFocusTarget(focusTarget);
    setSubmitDialogOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const nextLoginId = String(formData.get("login_id") ?? "").trim();
    const nextPassword = String(formData.get("password") ?? "");
    const nextPasswordConfirm = String(formData.get("password_confirm") ?? "");
    const name = String(formData.get("name") ?? "").trim();
    const nextEmail = String(formData.get("email") ?? "").trim();
    const nickname = String(formData.get("nickname") ?? "").trim();

    const nextLoginIdError = validateLoginId(nextLoginId);
    setLoginIdError(nextLoginIdError ?? "");
    if (nextLoginIdError) {
      loginIdInputRef.current?.focus();
      return;
    }

    const nextPasswordError = validatePassword(nextPassword);
    setPasswordError(nextPasswordError ?? "");
    if (nextPasswordError) {
      passwordInputRef.current?.focus();
      return;
    }

    if (nextPassword !== nextPasswordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다.");
      passwordConfirmInputRef.current?.focus();
      return;
    }

    setPasswordConfirmError("");

    const nextEmailError = validateOptionalEmail(nextEmail);
    setEmailError(nextEmailError ?? "");
    if (nextEmailError) {
      emailInputRef.current?.focus();
      return;
    }

    if (!agreedToTerms) {
      setTermsError("서비스 이용약관 및 개인정보 처리방침에 동의해 주세요.");
      return;
    }
    setTermsError("");

    setIsSubmitting(true);

    try {
      await fetchAuthApiJson("/api/v2/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          login_id: nextLoginId,
          password: nextPassword,
          name: name || null,
          email: nextEmail || null,
          nickname: nickname || null,
        }),
      });
      router.replace("/login?signup=success");
    } catch (error) {
      if (error instanceof AuthApiError) {
        openSubmitDialog(getSignupErrorMessage(error.message), getSignupErrorFocusTarget(error.message));
      } else {
        openSubmitDialog("회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGoogleSignup() {
    openSubmitDialog("구글 회원가입은 현재 화면에서 바로 사용할 수 없습니다.");
  }

  return (
    <>
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
          <form className="space-y-5" noValidate onSubmit={handleSubmit}>
            <AuthFormField
              autoComplete="username"
              error={loginIdError}
              id="login_id"
              label="아이디"
              maxLength={LOGIN_ID_MAX_LENGTH}
              minLength={LOGIN_ID_MIN_LENGTH}
              name="login_id"
              placeholder="사용할 아이디를 입력하세요"
              ref={loginIdInputRef}
              required
              onChange={(event) => handleLoginIdChange(event.target.value)}
              value={loginId}
              type="text"
            />

            <AuthFormField
              autoComplete="new-password"
              error={passwordError}
              id="password"
              label="비밀번호"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              name="password"
              onChange={(event) => handlePasswordChange(event.target.value)}
              placeholder="비밀번호를 입력하세요"
              ref={passwordInputRef}
              required
              showPasswordToggle
              type="password"
              value={password}
            />

            <PasswordRequirements password={password} />

            <AuthFormField
              autoComplete="new-password"
              error={passwordConfirmError}
              id="password_confirm"
              label="비밀번호 확인"
              maxLength={PASSWORD_MAX_LENGTH}
              minLength={PASSWORD_MIN_LENGTH}
              name="password_confirm"
              placeholder="비밀번호를 다시 입력하세요"
              ref={passwordConfirmInputRef}
              required
              onChange={(event) => handlePasswordConfirmChange(event.target.value)}
              showPasswordToggle
              value={passwordConfirm}
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
              error={emailError}
              id="email"
              label="이메일"
              maxLength={EMAIL_MAX_LENGTH}
              name="email"
              placeholder="이메일 (선택)"
              ref={emailInputRef}
              onChange={(event) => handleEmailChange(event.target.value)}
              value={email}
              type="email"
            />

            <label className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm text-[#4A4438]" style={{ borderColor: "rgba(42,66,50,0.12)" }}>
              <input
                checked={agreedToTerms}
                className="mt-0.5 size-4 rounded border-[rgba(42,66,50,0.25)] text-[#2A4232] focus:ring-[#3D6B52]/20"
                onChange={(event) => {
                  setAgreedToTerms(event.target.checked);
                  setTermsError("");
                }}
                type="checkbox"
              />
              <span>
                <Link
                  className="font-medium text-[#2A4232] underline-offset-4 hover:underline"
                  href="/legal/terms"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  서비스 이용약관
                </Link>
                {" 및 "}
                <Link
                  className="font-medium text-[#2A4232] underline-offset-4 hover:underline"
                  href="/legal/privacy"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  개인정보 처리방침
                </Link>
                에 동의합니다.
              </span>
            </label>

            {termsError ? <p className="text-xs text-[#9A3F38]">{termsError}</p> : null}

            <AuthButton isLoading={isSubmitting} loadingText="가입 중..." type="submit">
              회원가입
            </AuthButton>
          </form>

          <AuthDivider />

          <GoogleLoginButton label="Google로 가입하기" onClick={handleGoogleSignup} />
        </AuthFormCard>
      </AuthFormLayout>

      <Dialog
        onOpenChange={(nextOpen) => {
          setSubmitDialogOpen(nextOpen);
          if (!nextOpen) {
            const nextFocusTarget = submitDialogFocusTarget;
            setSubmitDialogMessage("");
            setSubmitDialogFocusTarget(null);
            window.requestAnimationFrame(() => focusField(nextFocusTarget));
          }
        }}
        open={submitDialogOpen}
      >
        <DialogContent className="border-[rgba(42,66,50,0.12)] bg-[#FDFAF4] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#1A1714]" style={{ fontFamily: "'Noto Serif KR', serif" }}>
              회원가입 실패
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed text-[#6B6458]">
              {submitDialogMessage}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <AuthButton className="w-full" onClick={() => setSubmitDialogOpen(false)} type="button">
              확인
            </AuthButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
