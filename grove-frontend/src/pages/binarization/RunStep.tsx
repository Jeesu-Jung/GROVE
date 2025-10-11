import React from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { useAppStore } from '../../store/useAppStore';
import { useBinarizationStore } from '../../store/useBinarizationStore';

export const RunStep: React.FC = () => {
  const { setError } = useAppStore();
  const { items, firstModel, secondModel, apiKey, setApiKey, running, setRunning, progress, setProgress, setItems, nextStep, setStep } = useBinarizationStore();

  // Load API key from local storage on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('binarization_api_key');
      if (saved && !apiKey) setApiKey(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const callChatCompletions = async (model: string, key: string, content: string): Promise<string> => {
    const res = await fetch('/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({ model, messages: [{ role: 'user', content }] }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content ?? String(data ?? '');
  };

  const runBatch = async () => {
    if (!items || !firstModel || !secondModel || !apiKey.trim()) {
      setError('API 키와 두 모델을 선택하고 데이터를 업로드하세요');
      return;
    }
    setRunning(true);
    setProgress(0);
    try {
      const apiModel1 = mapModelName(firstModel);
      const apiModel2 = mapModelName(secondModel);
      const total = items.length * 2;
      let done = 0;
      const updated = [] as typeof items;
      for (let i = 0; i < items.length; i++) {
        const input = items[i].inputs;
        const out1 = await callChatCompletions(apiModel1, apiKey, input);
        done += 1; setProgress(Math.floor((done / total) * 100));
        const out2 = await callChatCompletions(apiModel2, apiKey, input);
        done += 1; setProgress(Math.floor((done / total) * 100));
        updated.push({ inputs: input, output1: out1, output2: out2 });
      }
      setItems(updated);
      setProgress(100);
      nextStep();
    } catch (e: any) {
      setError(`배치 처리 실패: ${e.message || e}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card title="3) API 키 입력 및 배치 실행" description="모든 inputs에 대해 두 모델을 호출합니다">
      <div className="space-y-3">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); try { localStorage.setItem('binarization_api_key', e.target.value); } catch {} }}
          placeholder="Enter your API key"
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">Your API key is stored locally and never sent to our servers</p>
        {running && (
          <div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Processing... {progress}%</p>
          </div>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStep(2)} disabled={running}>Prev</Button>
          <Button onClick={runBatch} disabled={!items || !firstModel || !secondModel || !apiKey.trim() || running} loading={running}>
            배치 실행
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RunStep;


