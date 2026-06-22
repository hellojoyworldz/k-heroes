"use client";

import { useRouter } from "next/navigation";
import { NavBar } from "@/figma-make/src/app/components/NavBar";
import { HeroSection } from "@/figma-make/src/app/components/HeroSection";
import { JourneySection } from "@/figma-make/src/app/components/JourneySection";
import { CharacterSection } from "@/figma-make/src/app/components/CharacterSection";
import { DataSection } from "@/figma-make/src/app/components/DataSection";
import { Footer } from "@/figma-make/src/app/components/Footer";

export default function Home() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Noto Sans KR', sans-serif",
        background:
          "linear-gradient(rgba(244,239,228,0.2), rgba(244,239,228,0.2)), url('/story-background.png') center/cover fixed",
      }}
    >
      <NavBar onStart={() => router.push("/select")} />
      <HeroSection onStart={() => router.push("/select")} />
      <JourneySection />
      <CharacterSection onDetail={(id) => router.push(`/character-detail/${encodeURIComponent(id)}`)} />
      <DataSection />
      <Footer />
    </div>
  );
}
