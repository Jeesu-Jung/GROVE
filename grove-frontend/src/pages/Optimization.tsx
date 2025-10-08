import React from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { useAppStore } from '../store/useAppStore';

interface BestModelItem {
  model: string;
  dataSize: number;
  task: string;
}

interface ApiResponse<T> {
  code: string;
  message: string;
  data: T;
  meta?: { totalCount?: number };
}

interface SearchItem {
  input?: string;
  inputs?: string;
  constraint?: string;
  output?: string;
  instruction?: string;
}

type BestModelDataSizeInfo = {
  programming?: number;
  math?: number;
  creativeWriting?: number;
  grammar?: number;
  history?: number;
};

export const Optimization: React.FC = () => {
  const { setError } = useAppStore();

  const [combos, setCombos] = React.useState<BestModelItem[]>([]);
  const [loadingCombos, setLoadingCombos] = React.useState(false);

  const [selectedModel, setSelectedModel] = React.useState<string>('');
  const [selectedDataSize, setSelectedDataSize] = React.useState<number | ''>('');
  const [selectedTask, setSelectedTask] = React.useState<string>('');

  const [results, setResults] = React.useState<SearchItem[]>([]);
  const [loadingSearch, setLoadingSearch] = React.useState(false);
  const [bestInfo, setBestInfo] = React.useState<BestModelDataSizeInfo | null>(null);
  const [totalCount, setTotalCount] = React.useState<number | null>(null);
  const [visibleCols, setVisibleCols] = React.useState<{ inputs: boolean; input: boolean; output: boolean; instruction: boolean; constraint: boolean }>({
    inputs: true,
    input: true,
    output: true,
    instruction: true,
    constraint: true,
  });

  // Fetch available combinations on mount
  React.useEffect(() => {
    const fetchCombos = async () => {
      try {
        setLoadingCombos(true);
        const res = await fetch('/v1/task-mixture/best-models');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: ApiResponse<BestModelItem[]> = await res.json();
        setCombos(json.data || []);
      } catch (e: any) {
        console.error(e);
        setError(`조합 목록을 불러오지 못했습니다: ${e.message || e}`);
      } finally {
        setLoadingCombos(false);
      }
    };
    fetchCombos();
  }, [setError]);

  // Derived options
  const modelOptions = React.useMemo(() => {
    const set = new Set<string>();
    combos.forEach(c => set.add(c.model));
    return Array.from(set).sort();
  }, [combos]);

  const dataSizeOptions = React.useMemo(() => {
    const set = new Set<number>();
    combos.filter(c => !selectedModel || c.model === selectedModel).forEach(c => set.add(c.dataSize));
    return Array.from(set).sort((a, b) => a - b);
  }, [combos, selectedModel]);

  const taskOptions = React.useMemo(() => {
    const set = new Set<string>();
    combos
      .filter(c => (!selectedModel || c.model === selectedModel) && (!selectedDataSize || c.dataSize === selectedDataSize))
      .forEach(c => set.add(c.task));
    return Array.from(set).sort();
  }, [combos, selectedModel, selectedDataSize]);

  // Reset children selections when parent changes
  React.useEffect(() => {
    setSelectedDataSize('');
    setSelectedTask('');
  }, [selectedModel]);
  React.useEffect(() => {
    setSelectedTask('');
  }, [selectedDataSize]);

  const canSearch = selectedModel && selectedDataSize && selectedTask;

  const handleSearch = async () => {
    if (!canSearch) return;
    try {
      setLoadingSearch(true);
      setResults([]);
      setBestInfo(null);
      setTotalCount(null);
      const params = new URLSearchParams({
        model: selectedModel,
        dataSize: String(selectedDataSize),
        task: selectedTask,
      });
      const url = `/v1/task-mixture/alpaca/search?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse<{ items: SearchItem[]; bestModelDataSizeInfo?: BestModelDataSizeInfo }> = await res.json();
      const items = (json.data && (json.data as any).items) || [];
      setResults(items);
      setBestInfo((json.data as any)?.bestModelDataSizeInfo || null);
      setTotalCount((json as any)?.meta?.totalCount ?? null);
    } catch (e: any) {
      console.error(e);
      setError(`검색 중 오류가 발생했습니다: ${e.message || e}`);
    } finally {
      setLoadingSearch(false);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const fileName = `optimization_search_${selectedModel}_${selectedDataSize}_${selectedTask}.json`;
    a.href = href;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  };

  const ResultTable: React.FC<{ items: SearchItem[] }> = ({ items }) => {
    if (!items.length) return null;
    return (
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {visibleCols.inputs && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Inputs</th>
              )}
              {visibleCols.input && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Input</th>
              )}
              {visibleCols.output && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Output</th>
              )}
              {visibleCols.instruction && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Instruction</th>
              )}
              {visibleCols.constraint && (
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200">Constraint</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {items.map((row, idx) => (
              <tr key={idx} className="bg-white dark:bg-gray-900/40">
                {visibleCols.inputs && (
                  <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-gray-300 max-w-[420px]">
                    {truncate(row.inputs || '', 140)}
                  </td>
                )}
                {visibleCols.input && (
                  <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-gray-300 max-w-[420px]">
                    {truncate(row.input || '', 140)}
                  </td>
                )}
                {visibleCols.output && (
                  <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-gray-300 max-w-[520px]">
                    {truncate(row.output || '', 200)}
                  </td>
                )}
                {visibleCols.instruction && (
                  <td className="px-4 py-3 align-top text-sm text-gray-900 dark:text-gray-100 max-w-[420px]">
                    {truncate(row.instruction || '', 140)}
                  </td>
                )}
                {visibleCols.constraint && (
                  <td className="px-4 py-3 align-top text-sm text-gray-700 dark:text-gray-300 max-w-[420px]">
                    {truncate(row.constraint || '', 140)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const truncate = (text: string, limit: number) => {
    if (!text) return '';
    if (text.length <= limit) return text;
    return text.slice(0, limit) + '…';
  };

  return (
    <div className="py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Optimization-driven Data Composition
        </h2>
        <p className="mt-1 text-gray-600 dark:text-gray-300">
          모델/데이터 크기/태스크를 선택해 최적 조합을 검색하고 결과를 확인하세요.
        </p>
      </div>

      {/* Step 1 */}
      <Card title="1) 조합 선택" description="model → data size → target task 순으로 선택 후 Search">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Model</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              disabled={loadingCombos || modelOptions.length === 0}
            >
              <option value="">선택하세요</option>
              {modelOptions.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Data size</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              value={selectedDataSize}
              onChange={(e) => setSelectedDataSize(e.target.value ? Number(e.target.value) : '')}
              disabled={!selectedModel || dataSizeOptions.length === 0}
            >
              <option value="">선택하세요</option>
              {dataSizeOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-700 dark:text-gray-300">Target task</label>
            <select
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
              value={selectedTask}
              onChange={(e) => setSelectedTask(e.target.value)}
              disabled={!selectedModel || !selectedDataSize || taskOptions.length === 0}
            >
              <option value="">선택하세요</option>
              {taskOptions.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={!canSearch} loading={loadingSearch} className="w-full">Search</Button>
          </div>
        </div>
      </Card>

      {/* Step 2 */}
      <Card title="2) 검색 결과" description="테이블로 미리보기, JSON 내보내기 지원">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {results.length ? `총 ${(totalCount ?? results.length)}건` : '결과 없음'}
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-xs text-gray-700 dark:text-gray-300">
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" className="rounded border-gray-300" checked={visibleCols.inputs} onChange={(e) => setVisibleCols(v => ({ ...v, inputs: e.target.checked }))} />
                <span>inputs</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" className="rounded border-gray-300" checked={visibleCols.input} onChange={(e) => setVisibleCols(v => ({ ...v, input: e.target.checked }))} />
                <span>input</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" className="rounded border-gray-300" checked={visibleCols.output} onChange={(e) => setVisibleCols(v => ({ ...v, output: e.target.checked }))} />
                <span>output</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" className="rounded border-gray-300" checked={visibleCols.instruction} onChange={(e) => setVisibleCols(v => ({ ...v, instruction: e.target.checked }))} />
                <span>instruction</span>
              </label>
              <label className="inline-flex items-center gap-1">
                <input type="checkbox" className="rounded border-gray-300" checked={visibleCols.constraint} onChange={(e) => setVisibleCols(v => ({ ...v, constraint: e.target.checked }))} />
                <span>constraint</span>
              </label>
            </div>
            <Button variant="secondary" size="sm" onClick={exportJSON} disabled={results.length === 0}>Export JSON</Button>
          </div>
        </div>
        {bestInfo && (
          <div className="mb-4 flex flex-wrap gap-2">
            {(['programming','math','creativeWriting','grammar','history'] as const).map((k) => (
              typeof bestInfo[k] !== 'undefined' ? (
                <span key={k} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200 text-xs">
                  <span className="font-medium">{labelize(k)}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/70 dark:bg-gray-800/60 text-gray-800 dark:text-gray-100 border border-blue-200 dark:border-blue-800">
                    {bestInfo[k]}
                  </span>
                </span>
              ) : null
            ))}
          </div>
        )}
        <ResultTable items={results} />
        {results.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-gray-700 dark:text-gray-300">원본 JSON 보기</summary>
            <pre className="mt-2 max-h-96 overflow-auto text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded-md text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700">{JSON.stringify(results, null, 2)}</pre>
          </details>
        )}
      </Card>
    </div>
  );
};

export default Optimization;

function labelize(key: string): string {
  switch (key) {
    case 'programming':
      return 'Programming';
    case 'math':
      return 'Math';
    case 'creativeWriting':
      return 'Creative Writing';
    case 'grammar':
      return 'Grammar';
    case 'history':
      return 'History';
    default:
      return key;
  }
}
