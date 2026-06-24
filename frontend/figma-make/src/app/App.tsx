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

  const goToResult = (uuid: string) => {
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
        charId={selectedCharId}
        scenarioIdx={0}
        onBack={() => setPage("character-detail")}
        onComplete={goToResult}
      />
    );
  }

  if (page === "result") {
    const dummyEnding = {
      result_code: "A-B-A",
      ending_type: "True Ending",
      title: "역사를 바꾼 위대한 폭발, 상하이 거사 대성공!",
      history_fact: "실제 역사와 동일합니다.",
      story_headline: "상하이 홍구공원 거사 성공",
      story_contents: "윤봉길 의사의 의거가 전 세계에 알려졌습니다.",
      summary_items: [],
      recommended_places: [],
      ending_markdown: "",
      output_file_path: "",
    };
    return (
      <ResultPage
        charId={selectedCharId}
        ending={dummyEnding}
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
