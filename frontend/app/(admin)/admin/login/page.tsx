"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AdminButton } from "@/app/(admin)/_components/admin-button";
import { AdminFormField } from "@/app/(admin)/_components/admin-form-field";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      // TODO: 인증 API 연동
      router.push("/admin");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="grid min-h-screen grid-cols-1 md:grid-cols-2"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* 왼쪽 */}
      <section className="relative hidden bg-[#2A4232] md:flex md:items-center md:justify-center">
        <div className="text-center text-white">
          <div className="mx-auto mb-8 flex size-16 items-center justify-center rounded-2xl bg-white/10">
            <Image
              alt=""
              className="brightness-0 invert"
              height={36}
              priority
              src="/logo.svg"
              width={32}
            />
          </div>
          <p
            className="text-3xl font-semibold tracking-tight"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            K-Heroes
          </p>
          <p className="mt-2 text-base text-white/50">Admin</p>
        </div>
      </section>

      {/* 오른쪽 */}
      <section className="flex min-h-screen items-center justify-center bg-[#FAFAF8] px-8">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 md:hidden">
            <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-[#2A4232]">
              <Image
                alt=""
                className="brightness-0 invert"
                height={24}
                priority
                src="/logo.svg"
                width={22}
              />
            </div>
            <p
              className="text-xl font-semibold text-[#1A1714]"
              style={{ fontFamily: "'Noto Serif KR', serif" }}
            >
              K-Heroes Admin
            </p>
          </div>

          <h1
            className="text-2xl font-semibold text-[#1A1714]"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            로그인
          </h1>
          <p className="mt-2 text-sm text-[#8A847C]">관리자 계정으로 로그인하세요.</p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <AdminFormField
              autoComplete="username"
              id="username"
              label="아이디"
              name="username"
              placeholder="아이디를 입력하세요"
              required
              type="text"
            />

            <AdminFormField
              autoComplete="current-password"
              id="password"
              label="비밀번호"
              minLength={8}
              name="password"
              placeholder="비밀번호를 입력하세요"
              required
              type="password"
            />

            <AdminButton isLoading={isSubmitting} loadingText="로그인 중..." type="submit">
              로그인
            </AdminButton>
          </form>
        </div>
      </section>
    </div>
  );
}
