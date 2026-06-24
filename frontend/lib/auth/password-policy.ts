export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

export type PasswordRule = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

/** 영문·숫자·특수문자 중 2가지 이상 (KISA 개인정보 안전성 확보 조치 권고 수준) */
export const passwordRules: PasswordRule[] = [
  {
    id: "length",
    label: `${PASSWORD_MIN_LENGTH}자 이상 ${PASSWORD_MAX_LENGTH}자 이하`,
    test: (password) => password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
  },
  {
    id: "letter",
    label: "영문 포함",
    test: (password) => /[a-zA-Z]/.test(password),
  },
  {
    id: "number",
    label: "숫자 포함",
    test: (password) => /\d/.test(password),
  },
  {
    id: "special",
    label: "특수문자 포함 (!@#$%^&* 등)",
    test: (password) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  },
];

export function countPasswordCharacterTypes(password: string) {
  let count = 0;
  if (/[a-zA-Z]/.test(password)) count += 1;
  if (/\d/.test(password)) count += 1;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password)) count += 1;
  return count;
}

export function validatePassword(password: string): string | null {
  if (
    password.length < PASSWORD_MIN_LENGTH ||
    password.length > PASSWORD_MAX_LENGTH ||
    countPasswordCharacterTypes(password) < 2
  ) {
    return "비밀번호 조건을 확인해 주세요.";
  }

  return null;
}
