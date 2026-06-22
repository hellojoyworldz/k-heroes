type AdminSectionPlaceholderProps = {
  title: string;
  description: string;
};

export function AdminSectionPlaceholder({ description, title }: AdminSectionPlaceholderProps) {
  return (
    <div className="rounded-xl border border-dashed border-[#D6D0C6] bg-white px-6 py-16 text-center">
      <p className="text-base font-medium text-[#1A1714]">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#8A847C]">{description}</p>
    </div>
  );
}
