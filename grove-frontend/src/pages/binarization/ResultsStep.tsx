import React from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { useBinarizationStore } from '../../store/useBinarizationStore';

export const ResultsStep: React.FC = () => {
  const { items, setStep, firstModel, secondModel, reset } = useBinarizationStore();
  const [pageSize, setPageSize] = React.useState(10);
  const [page, setPage] = React.useState(1);

  const paged = React.useMemo(() => {
    if (!items) return [];
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const totalPages = React.useMemo(() => {
    if (!items) return 1;
    return Math.max(1, Math.ceil(items.length / pageSize));
  }, [items, pageSize]);

  const mapModelName = (name: string): string => {
    if (!name) return name;
    const norm = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const dict: Record<string, string> = {
      'gpt 4': 'openai/gpt-4',
      'gpt 3 5 turbo': 'openai/gpt-3.5-turbo',
      'gemini 2 5 flash': 'google/gemini-2.5-flash',
      'llama 3 1 8b instruct': 'meta-llama/llama-3.1-8b-instruct',
      'llama 2 13b chat': 'meta-llama/llama-2-13b-chat',
      'llama 2 70b chat': 'meta-llama/llama-2-70b-chat',
      'wizardlm 2 7b': 'microsoft/wizardlm-2-7b',
      'wizardlm 2 8x22b': 'microsoft/wizardlm-2-8x22b',
    };
    return dict[norm] || name;
  };

  const exportJSON = () => {
    if (!items) return;
    const chosenModel = mapModelName(firstModel);
    const rejectedModel = mapModelName(secondModel);
    const cleaned = items.map(({ inputs, output1, output2 }) => ({
      inputs,
      chosen: output1,
      rejected: output2,
      chosen_model: chosenModel,
      rejected_model: rejectedModel,
    }));
    const blob = new Blob([JSON.stringify(cleaned, null, 2)], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = 'binarization_results.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(href);
  };

  const truncate = (t: string, n: number) => (!t ? '' : (t.length <= n ? t : t.slice(0, n) + '…'));

  return (
    <Card title="4) 결과 확인">
      {!items || items.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">아직 데이터가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <span>Rows per page:</span>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {[5,10,20,50].map(n => (<option key={n} value={n}>{n}</option>))}
              </select>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportJSON}>Export JSON</Button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold">inputs</th>
                  <th className="px-4 py-2 text-left font-semibold">chosen</th>
                  <th className="px-4 py-2 text-left font-semibold">rejected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {paged.map((row, idx) => (
                  <tr key={idx} className="bg-white dark:bg-gray-900/40">
                    <td className="px-4 py-2 align-top max-w-[480px] text-gray-900 dark:text-gray-100">{truncate(row.inputs, 160)}</td>
                    <td className="px-4 py-2 align-top max-w-[480px] text-gray-700 dark:text-gray-300">{truncate(row.output1 || '', 180)}</td>
                    <td className="px-4 py-2 align-top max-w-[480px] text-gray-700 dark:text-gray-300">{truncate(row.output2 || '', 180)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Page {page} / {totalPages}</span>
            <div className="flex gap-2 items-center">
              {totalPages > 1 && (
                <>
                  <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
                  <Button size="sm" variant="secondary" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
                </>
              )}
              <Button size="sm" variant="outline" onClick={() => reset()}>새 작업 실행</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default ResultsStep;


