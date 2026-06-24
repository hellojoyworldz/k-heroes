import { Check, Circle } from "lucide-react";
import { passwordRules } from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils/cn";

type PasswordRequirementsProps = {
  password: string;
};

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const typeRulePassed =
    password.length === 0
      ? false
      : [passwordRules[1], passwordRules[2], passwordRules[3]].filter((rule) => rule.test(password)).length >= 2;

  return (
    <div
      aria-live="polite"
      className="rounded-lg border px-4 py-3"
      style={{ borderColor: "rgba(42,66,50,0.12)", background: "rgba(42,66,50,0.03)" }}
    >
      <p className="text-xs font-medium text-[#4A4438]">비밀번호 조건</p>
      <p className="mt-1 text-xs leading-relaxed text-[#8A847C]">
        개인정보 보호를 위해 아래 조건을 충족해 주세요. (영문·숫자·특수문자 중 2가지 이상 조합)
      </p>
      <ul className="mt-3 space-y-2">
        <RequirementItem label={passwordRules[0].label} passed={passwordRules[0].test(password)} />
        <RequirementItem
          label="영문, 숫자, 특수문자 중 2가지 이상"
          passed={typeRulePassed}
        />
      </ul>
    </div>
  );
}

function RequirementItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {passed ? (
        <Check aria-hidden className="size-3.5 shrink-0 text-[#3D6B52]" />
      ) : (
        <Circle aria-hidden className="size-3.5 shrink-0 text-[#C4BEB4]" />
      )}
      <span className={cn(passed ? "text-[#3A3530]" : "text-[#8A847C]")}>{label}</span>
    </li>
  );
}
