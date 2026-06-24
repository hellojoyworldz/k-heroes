export function AuthDivider({ label = "또는" }: { label?: string }) {
  return (
    <div className="relative my-6">
      <div aria-hidden className="absolute inset-0 flex items-center">
        <div className="w-full border-t" style={{ borderColor: "rgba(42,66,50,0.12)" }} />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-[#FDFAF4] px-3 text-xs text-[#8A847C]">{label}</span>
      </div>
    </div>
  );
}
