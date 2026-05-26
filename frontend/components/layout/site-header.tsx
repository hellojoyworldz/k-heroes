import Link from "next/link";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/scenario", label: "시나리오" },
  { href: "/simulation", label: "시뮬레이션" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-[var(--border)] bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          K-Heroes
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-[var(--muted-foreground)]">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-[var(--primary)]">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
