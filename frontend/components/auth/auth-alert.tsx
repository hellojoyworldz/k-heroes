type AuthAlertProps = {
  message: string;
  variant?: "error" | "info";
};

export function AuthAlert({ message, variant = "error" }: AuthAlertProps) {
  const styles =
    variant === "error"
      ? "border-[#E6C9C5] bg-[#FDF6F5] text-[#9A3F38]"
      : "border-[rgba(42,66,50,0.15)] bg-[rgba(42,66,50,0.05)] text-[#3A3530]";

  return (
    <p aria-live="polite" className={`rounded-lg border px-4 py-3 text-sm ${styles}`} role="alert">
      {message}
    </p>
  );
}
