import { create } from "zustand";

type SimulationState = {
  selectedChoiceId: string | null;
  selectChoice: (choiceId: string) => void;
  resetChoice: () => void;
};

export const useSimulationStore = create<SimulationState>((set) => ({
  selectedChoiceId: null,
  selectChoice: (choiceId) => set({ selectedChoiceId: choiceId }),
  resetChoice: () => set({ selectedChoiceId: null }),
}));
