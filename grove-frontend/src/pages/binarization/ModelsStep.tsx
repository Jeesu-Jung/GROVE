import React from 'react';
import { Card } from '../../components/UI/Card';
import { Button } from '../../components/UI/Button';
import { useAppStore } from '../../store/useAppStore';
import { useBinarizationStore } from '../../store/useBinarizationStore';

type BestModelsResponse = {
  code: string;
  message: string;
  data: {
    superior: { first: string; second: string };
    similarity: { first: string; second: string };
    superiorPlusSimilarity: { first: string; second: string };
  };
};

type ModelsResponse = { code: string; message: string; data: Array<{ model: string }> };
type SimilarityResponse = { code: string; message: string; data: { model: string } };

export const ModelsStep: React.FC = () => {
  const { setError } = useAppStore();
  const {
    includeIF, includeKnowledge, includeReasoning, setAbilities,
    best, setBest, allModels, setAllModels,
    firstModel, setFirstModel, secondModel, setSecondModel, nextStep, setStep,
  } = useBinarizationStore();

  const [loadingBest, setLoadingBest] = React.useState(false);
  const [loadingModels, setLoadingModels] = React.useState(false);
  const [customMode, setCustomMode] = React.useState(false);
  const [customFirst, setCustomFirst] = React.useState('');
  const [customSecond, setCustomSecond] = React.useState('');

  const fetchBestModels = async () => {
    try {
      setLoadingBest(true);
      const q = new URLSearchParams({
        includeInstructionFollowing: String(includeIF),
        includeKnowledge: String(includeKnowledge),
        includeReasoning: String(includeReasoning),
      });
      const res = await fetch(`/v1/benchmark/best-models?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: BestModelsResponse = await res.json();
      setBest(json.data);
    } catch (e: any) {
      setError(`최적 모델 조회 실패: ${e.message || e}`);
    } finally {
      setLoadingBest(false);
    }
  };

  const fetchAllModels = async () => {
    try {
      setLoadingModels(true);
      const res = await fetch('/v1/benchmark/models');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ModelsResponse = await res.json();
      setAllModels(json.data?.map(m => m.model) || []);
    } catch (e: any) {
      setError(`모델 목록 조회 실패: ${e.message || e}`);
    } finally {
      setLoadingModels(false);
    }
  };

  const fetchSimilarity = async (base?: string, setToCustom?: boolean) => {
    const modelBase = base || firstModel;
    if (!modelBase) return;
    try {
      const q = new URLSearchParams({
        includeInstructionFollowing: String(includeIF),
        includeKnowledge: String(includeKnowledge),
        includeReasoning: String(includeReasoning),
        model: modelBase,
      });
      const res = await fetch(`/v1/benchmark/similarity/search?${q.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: SimilarityResponse = await res.json();
      if (setToCustom) {
        setCustomSecond(json.data?.model || '');
      } else {
        setSecondModel(json.data?.model || '');
      }
    } catch (e: any) {
      setError(`유사 모델 조회 실패: ${e.message || e}`);
    }
  };

  // Load models on mount
  React.useEffect(() => {
    fetchAllModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch similarity when custom first model selected
  React.useEffect(() => {
    if (customMode && customFirst) {
      fetchSimilarity(customFirst, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customMode, customFirst, includeIF, includeKnowledge, includeReasoning]);

  const ModelPill: React.FC<{ label: string; value: string; active: boolean; onClick: () => void }>
    = ({ label, value, active, onClick }) => (
    <button
      className={`px-3 py-1.5 rounded-full border text-sm transition ${active ? 'border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
      onClick={onClick}
    >
      <span className="font-medium mr-1">{label} :</span>
      <span className="truncate max-w-[240px] inline-block align-middle">{value}</span>
    </button>
  );

  return (
    <div className="space-y-6">
      <Card title="2) 타겟 어빌리티 선택 및 최적 모델 조회" description="체크한 능력을 기준으로 superior/similarity 후보 조회">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 items-center">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeIF} onChange={e => setAbilities({ includeIF: e.target.checked })} /> Instruction following
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeKnowledge} onChange={e => setAbilities({ includeKnowledge: e.target.checked })} /> Knowledge
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeReasoning} onChange={e => setAbilities({ includeReasoning: e.target.checked })} /> Reasoning
            </label>
            <Button onClick={fetchBestModels} loading={loadingBest}>최적 모델 조회</Button>
          </div>

          {best && (
            <div className="grid md:grid-cols-4 gap-4">
              {(['superior','similarity','superiorPlusSimilarity'] as const).map(k => (
                <div key={k} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 text-center mb-3">
                    {k === 'superiorPlusSimilarity' ? 'superior+similarity' : k}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex flex-col gap-2 items-center w-full">
                      <ModelPill label="1st" value={best[k].first} active={firstModel===best[k].first && secondModel===best[k].second} onClick={() => { setFirstModel(best[k].first); setSecondModel(best[k].second); setCustomMode(false); }} />
                      <ModelPill label="2nd" value={best[k].second} active={firstModel===best[k].first && secondModel===best[k].second} onClick={() => { setFirstModel(best[k].first); setSecondModel(best[k].second); setCustomMode(false); }} />
                    </div>
                    <Button size="sm" variant="secondary" className="w-full" onClick={() => { setFirstModel(best[k].first); setSecondModel(best[k].second); setCustomMode(false); }}>선택</Button>
                  </div>
                </div>
              ))}

              {/* Custom pair */}
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300 text-center mb-3">Custom</div>
                <div className="space-y-2">
                  <select value={customFirst} onChange={e => { setCustomMode(true); setCustomFirst(e.target.value); setCustomSecond(''); }} className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    <option value="">First model 선택</option>
                    {allModels.map(m => (<option key={m} value={m}>{m}</option>))}
                  </select>
                  <input className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100" value={customSecond ? `Second: ${customSecond}` : 'first 모델 선택 시 자동 설정'} readOnly />
                  <Button size="sm" variant="secondary" className="w-full" onClick={() => { if (customFirst && customSecond) { setFirstModel(customFirst); setSecondModel(customSecond); setCustomMode(true); } }} disabled={!customFirst || !customSecond}>선택</Button>
                </div>
              </div>
            </div>
          )}

          {(firstModel || secondModel) && (
            <div className="text-sm">
              <span className="text-gray-600 dark:text-gray-300">선택됨: </span>
              <span className="inline-flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md border border-blue-400 text-blue-700 dark:text-blue-300">first: {firstModel || '-'}</span>
                <span className="px-2 py-0.5 rounded-md border border-purple-400 text-purple-700 dark:text-purple-300">second: {secondModel || '-'}</span>
              </span>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)}>Prev</Button>
                <Button onClick={nextStep} disabled={!firstModel || !secondModel}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ModelsStep;


