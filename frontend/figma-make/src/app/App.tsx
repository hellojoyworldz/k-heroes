"use client";

import { useState } from "react";
import { NavBar } from "./components/NavBar";
import { HeroSection } from "./components/HeroSection";
import { JourneySection } from "./components/JourneySection";
import { CharacterSection } from "./components/CharacterSection";
import { DataSection } from "./components/DataSection";
import { Footer } from "./components/Footer";
import { RegionMapPage } from "./components/RegionMapPage";
import { CharacterDetailPage } from "./components/CharacterDetailPage";
import { SimulationPage } from "./components/SimulationPage";
import { ResultPage } from "./components/ResultPage";

type Page = "landing" | "select" | "character-detail" | "simulation" | "result";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [selectedCharId, setSelectedCharId] = useState<string>("yunbongil");
  const [simulationSelections, setSimulationSelections] = useState<Record<number, "A" | "B">>({});

  const goToDetail = (id: string) => {
    setSelectedCharId(id);
    setPage("character-detail");
  };

  const goToSimulation = () => {
    setPage("simulation");
  };

  const goToResult = (selections: Record<number, "A" | "B">) => {
    setSimulationSelections(selections);
    setPage("result");
  };

  if (page === "select") {
    return <RegionMapPage onBack={() => setPage("landing")} onDetail={goToDetail} />;
  }

  if (page === "character-detail") {
    return (
      <CharacterDetailPage
        charId={selectedCharId}
        onBack={() => setPage("landing")}
        onStartScenario={goToSimulation}
      />
    );
  }

  if (page === "simulation") {
    return (
      <SimulationPage
        onBack={() => setPage("character-detail")}
        onComplete={goToResult}
      />
    );
  }

  if (page === "result") {
    return (
      <ResultPage
        charId={selectedCharId}
        selections={simulationSelections}
        onBack={() => setPage("simulation")}
        onNextChar={() => setPage("select")}
      />
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        fontFamily: "'Noto Sans KR', sans-serif",
        background:
          "linear-gradient(rgba(244,239,228,0.2), rgba(244,239,228,0.2)), url('/story-background.png') center/cover fixed",
      }}
    >
      <NavBar onStart={() => setPage("select")} />
      <HeroSection onStart={() => setPage("select")} />
      <JourneySection />
      <CharacterSection onDetail={goToDetail} />
      <DataSection />
      <Footer />
    </div>
  );
}
