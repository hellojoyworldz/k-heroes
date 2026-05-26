type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PagePlaceholder({ eyebrow, title, description }: PagePlaceholderProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-65px)] max-w-6xl items-center px-6 py-12">
      <section className="w-full rounded-3xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-[var(--primary)]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 leading-7 text-[var(--muted-foreground)]">{description}</p>
      </section>
    </div>
  );
}
