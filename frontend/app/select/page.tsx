"use client";

import { useRouter } from "next/navigation";
import { RegionMapPage } from "@/figma-make/src/app/components/RegionMapPage";

export default function SelectPage() {
  const router = useRouter();

  return (
    <RegionMapPage
      onBack={() => router.push("/")}
      onDetail={(id) => router.push(`/character-detail/${id}`)}
    />
  );
}
