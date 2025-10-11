import { create } from 'zustand';

export type BinarizationItem = {
  inputs: string;
  output1?: string;
  output2?: string;
};

type BestData = {
  superior: { first: string; second: string };
  similarity: { first: string; second: string };
  superiorPlusSimilarity: { first: string; second: string };
} | null;

interface BinarizationState {
  step: number;
  items: BinarizationItem[] | null;
  fileName: string;
  includeIF: boolean;
  includeKnowledge: boolean;
  includeReasoning: boolean;
  best: BestData;
  allModels: string[];
  firstModel: string;
  secondModel: string;
  apiKey: string;
  running: boolean;
  progress: number;
  setItems: (items: BinarizationItem[] | null, fileName?: string) => void;
  setStep: (step: number) => void;
  nextStep: () => void;
  setAbilities: (p: Partial<Pick<BinarizationState,'includeIF'|'includeKnowledge'|'includeReasoning'>>) => void;
  setBest: (best: BestData) => void;
  setAllModels: (models: string[]) => void;
  setFirstModel: (model: string) => void;
  setSecondModel: (model: string) => void;
  setApiKey: (key: string) => void;
  setRunning: (running: boolean) => void;
  setProgress: (pct: number) => void;
  reset: () => void;
}

const initialState: Omit<BinarizationState, 'setItems' | 'setStep' | 'nextStep' | 'setAbilities' | 'setBest' | 'setAllModels' | 'setFirstModel' | 'setSecondModel' | 'setApiKey' | 'setRunning' | 'setProgress' | 'reset'> = {
  step: 1,
  items: null,
  fileName: '',
  includeIF: true,
  includeKnowledge: true,
  includeReasoning: true,
  best: null,
  allModels: [],
  firstModel: '',
  secondModel: '',
  apiKey: '',
  running: false,
  progress: 0,
};

export const useBinarizationStore = create<BinarizationState>((set) => ({
  ...initialState,
  setItems: (items, fileName) => set({ items, fileName: fileName ?? '' }),
  setStep: (step) => set({ step }),
  nextStep: () => set((s) => ({ step: Math.min(4, (s.step || 1) + 1) } as any)),
  setAbilities: (p) => set(p),
  setBest: (best) => set({ best }),
  setAllModels: (allModels) => set({ allModels }),
  setFirstModel: (firstModel) => set({ firstModel }),
  setSecondModel: (secondModel) => set({ secondModel }),
  setApiKey: (apiKey) => set({ apiKey }),
  setRunning: (running) => set({ running }),
  setProgress: (progress) => set({ progress }),
  reset: () => set({ ...initialState }),
}));


