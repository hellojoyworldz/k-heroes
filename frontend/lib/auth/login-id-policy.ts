export const LOGIN_ID_MIN_LENGTH = 4;
export const LOGIN_ID_MAX_LENGTH = 50;

function isLowercaseEnglishLetter(character: string) {
  return character >= "a" && character <= "z";
}

function isAllowedLoginIdCharacter(character: string) {
  return (
    isLowercaseEnglishLetter(character) ||
    (character >= "0" && character <= "9") ||
    (character >= "!" && character <= "~" && !/[A-Za-z0-9]/.test(character))
  );
}

export function normalizeLoginId(loginId: string) {
  return loginId.trim();
}

export function validateLoginId(loginId: string): string | null {
  const normalized = normalizeLoginId(loginId);

  if (!normalized) {
    return "아이디를 입력해 주세요.";
  }

  if (!isLowercaseEnglishLetter(normalized[0])) {
    return "아이디는 소문자로 시작해 주세요.";
  }

  for (const character of normalized) {
    if (!isAllowedLoginIdCharacter(character)) {
      return "아이디는 소문자/숫자/특수문자만 입력해 주세요.";
    }
  }

  if (
    normalized.length < LOGIN_ID_MIN_LENGTH ||
    normalized.length > LOGIN_ID_MAX_LENGTH
  ) {
    return "아이디는 4자 이상 50자 이하로 입력해 주세요.";
  }

  return null;
}
