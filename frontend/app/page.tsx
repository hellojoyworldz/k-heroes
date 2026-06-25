"use client";

import { useRouter } from "next/navigation";
import { NavBar } from "@/components/layout/NavBar";
import { HeroSection } from "@/components/home/HeroSection";
import { JourneySection } from "@/components/home/JourneySection";
import { CharacterSection } from "@/components/home/CharacterSection";
import { DataSection } from "@/components/home/DataSection";
import { Footer } from "@/components/layout/Footer";

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
