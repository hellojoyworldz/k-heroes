"use client";

import { useRouter } from "next/navigation";
import { AuthButton } from "@/components/auth/auth-button";
import { SitePageShell } from "@/components/layout/site-page-shell";
import {
  MypageAccountInfo,
  MypageProfileCard,
  MypageSessionHistory,
} from "@/components/mypage/mypage-sections";
import { TeacherGradeApplyDialog } from "@/components/mypage/teacher-grade-apply";
import { mockPlaySessions, mockUserProfile } from "@/lib/mypage/mock-data";

export function MypageContent() {
  const router = useRouter();

  // TODO: /api/v2/auth/me, /api/v2/auth/sessions 연동
  const user = mockUserProfile;
  const sessions = mockPlaySessions;

  return (
    <SitePageShell>
      <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <header className="mb-8 sm:mb-10">
          <p
            className="text-sm font-medium text-[#3D6B52]"
            style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
          >
            MY PAGE
          </p>
          <h1
            className="mt-2 text-3xl font-semibold text-[#1A1714] sm:text-4xl"
            style={{ fontFamily: "'Noto Serif KR', serif" }}
          >
            마이페이지
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#6B6458] sm:text-base">
            나의 계정 정보와 시뮬레이션 기록을 확인하고, 이어서 진행 중인 이야기를 다시 시작할 수 있습니다.
          </p>
        </header>

        <div className="mb-6 rounded-xl border px-4 py-3 text-sm text-[#6B6458]" style={{ borderColor: "rgba(42,66,50,0.12)", background: "rgba(253,250,244,0.8)" }}>
          현재는 UI 미리보기입니다. 로그인 API 연동 후 실제 계정 정보가 표시됩니다.
        </div>

        <div className="space-y-6">
          <MypageProfileCard user={user} />

          <MypageAccountInfo
            footer={
              <>
                {user.grade === "student" ? <TeacherGradeApplyDialog /> : null}
                <AuthButton onClick={() => undefined} size="sm" type="button" variant="ghost">
                  로그아웃
                </AuthButton>
              </>
            }
            user={user}
          />

          <MypageSessionHistory sessions={sessions} />

          <AuthButton className="sm:max-w-xs" onClick={() => router.push("/map")} type="button">
            새 이야기 시작하기
          </AuthButton>
        </div>
      </div>
    </SitePageShell>
  );
}
