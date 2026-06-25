export const EMAIL_MAX_LENGTH = 255;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string) {
  return email.trim();
}

export function validateOptionalEmail(email: string): string | null {
  const normalized = normalizeEmail(email);

  if (!normalized) {
    return null;
  }

  if (normalized.length > EMAIL_MAX_LENGTH) {
    return "이메일은 255자 이하로 입력해 주세요.";
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return "이메일 형식이 올바르지 않습니다.";
  }

  return null;
}
