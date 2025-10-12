import React from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { useBinarizationStore } from '../../store/useBinarizationStore';

export const ResultsStep: React.FC = () => {
  const { items, firstModel, secondModel } = useBinarizationStore();
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
    console.log(name);
    if (!name) return name;
    const norm = name.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const dict: Record<string, string> = {
      'gpt 4': 'openai/gpt-4',
      'gpt 3 5 turbo': 'openai/gpt-3.5-turbo',
      'gemini 2 5 flash': 'google/gemini-2.5-flash',
      'llama 3 1 8b instruct': 'meta-llama/llama-3.1-8b-instruct',
      'llama 4 maverick': 'meta-llama/llama-4-maverick:free',
      'llama 3 3 70b instruct': 'meta-llama/llama-3.3-70b-instruct',
      'mistral nemo': 'mistralai/mistral-nemo',
      'mixtral 8x7b instruct': 'mistralai/mixtral-8x7b-instruct',
      'gpt oss 20b': 'openai/gpt-oss-20b',
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

  const getPageButtons = (current: number, total: number): (number | '…')[] => {
    const buttons: (number | '…')[] = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) buttons.push(i);
      return buttons;
    }
    buttons.push(1);
    if (current > 3) buttons.push('…');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) buttons.push(i);
    if (current < total - 2) buttons.push('…');
    buttons.push(total);
    return buttons;
  };

  return (
    <Card title="4) Review results">
      {!items || items.length === 0 ? (
        <p className="text-sm text-gray-600 dark:text-gray-300">No data yet.</p>
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
          {totalPages > 1 && (
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className={page === 1 ? 'opacity-60 cursor-not-allowed' : ''}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </Button>
                {getPageButtons(page, totalPages).map((b, i) => (
                  b === '…' ? (
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-500">…</span>
                  ) : (
                    <button
                      key={b}
                      className={`px-3 py-1 rounded border text-sm ${b === page ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/20 dark:text-blue-200' : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      onClick={() => setPage(b as number)}
                    >
                      {b}
                    </button>
                  )
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  className={page === totalPages ? 'opacity-60 cursor-not-allowed' : ''}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, items?.length || 0)} of {items?.length || 0}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default ResultsStep;


