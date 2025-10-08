import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Dataset, TextStatistics, DomainAnalysis, SampledDataset } from '../types';

interface AppStore extends AppState {
  setCurrentPage: (page: number) => void;
  setDataset: (dataset: Dataset) => void;
  setStatistics: (statistics: TextStatistics) => void;
  setDomainAnalysis: (analysis: DomainAnalysis) => void;
  setSampledDataset: (sampled: SampledDataset) => void;
  setLlmApiKey: (key: string) => void;
  setSelectedModel: (model: string) => void;
  setIsProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentPage: 1,
  dataset: null,
  statistics: null,
  domainAnalysis: null,
  sampledDataset: null,
  llmApiKey: '',
  selectedModel: 'claude-3-sonnet',
  isProcessing: false,
  error: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...initialState,
      setCurrentPage: (page) => set({ currentPage: page }),
      setDataset: (dataset) => set({ dataset }),
      setStatistics: (statistics) => set({ statistics }),
      setDomainAnalysis: (analysis) => set({ domainAnalysis: analysis }),
      setSampledDataset: (sampled) => set({ sampledDataset: sampled }),
      setLlmApiKey: (key) => set({ llmApiKey: key }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setIsProcessing: (processing) => set({ isProcessing: processing }),
      setError: (error) => set({ error }),
      reset: () => set(initialState),
    }),
    {
      name: 'dataset-analyzer-v2',
      partialize: (state) => ({
        // 최소한만 저장: 모델/키 설정만 유지
        llmApiKey: state.llmApiKey,
        selectedModel: state.selectedModel,
      }),
    }
  )
);