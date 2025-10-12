export interface DatasetRow {
  [key: string]: string | number;
}

export interface Dataset {
  data: DatasetRow[];
  columns: string[];
  inputColumn?: string;
  outputColumn?: string;
  fileName?: string;
  fileSize?: number;
}

export interface TextStatistics {
  totalSamples: number;
  avgInputLength: number;
  avgOutputLength: number;
  uniqueInputs: number;
  uniqueOutputs: number;
  inputLengthDistribution: number[];
  outputLengthDistribution: number[];
  topWords: { word: string; count: number }[];
  lengthStats: {
    input: StatsSummary;
    output: StatsSummary;
  };
}

export interface StatsSummary {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
}

export interface Domain {
  name: string;
  count: number;
  percentage: number;
  examples: string[];
  verbObjectPairs: Array<{ verb: string; object: string }>;
}

export interface DomainAnalysis {
  domains: Domain[];
  totalProcessed: number;
  processingTime: number;
  modelUsed: string;
  assignments?: InstructionAssignment[];
}

export interface SamplingStrategy {
  type: 'top3' | 'custom' | 'balanced' | 'lv' | 'hv' | 'mix' | 'tasks_top3' | 'tasks_custom' | 'tasks_balanced';
  samplesPerDomain?: number;
  selectedDomains?: string[];
  selectedTasks?: string[];
  totalSamples?: number;
  pPercent?: number; // for model-centric strategies
}

export interface SampledDataset {
  data: DatasetRow[];
  strategy: SamplingStrategy;
  domainDistribution: { [domain: string]: number };
  totalSamples: number;
}

export interface InstructionAssignment {
  id: number;
  datasetIndex: number;
  instruction: string;
  domainName: string;
  verbObjectPairs: Array<{ verb: string; object: string }>;
  viaLLM: boolean;
  taskName?: string;
}

export interface AppState {
  currentPage: number;
  dataset: Dataset | null;
  statistics: TextStatistics | null;
  domainAnalysis: DomainAnalysis | null;
  sampledDataset: SampledDataset | null;
  llmApiKey: string;
  selectedModel: string;
  isProcessing: boolean;
  error: string | null;
}

export type LLMModel =
  | 'claude-3-sonnet'
  | 'claude-3-opus'
  | 'gpt-4'
  | 'gpt-4-turbo'
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano';