"use client";

import { useRouter } from "next/navigation";
import { RegionMapPage } from "@/components/select/RegionMapPage";

export default function SelectPage() {
  const router = useRouter();

  return (
    <RegionMapPage
      onBack={() => router.push("/")}
      onDetail={(id) => router.push(`/character/${encodeURIComponent(id)}`)}
    />
  );
}
