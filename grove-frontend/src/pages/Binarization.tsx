import React from 'react';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useBinarizationStore } from '../store/useBinarizationStore';
import { ProgressIndicator } from '../components/Layout/ProgressIndicator';

type BestModelsResponse = {
  code: string;
  message: string;
  data: {
    superior: { first: string; second: string };
    similarity: { first: string; second: string };
    superiorPlusSimilarity: { first: string; second: string };
  };
};

type ModelsResponse = {
  code: string;
  message: string;
  data: Array<{ model: string }>;
};

type SimilarityResponse = {
  code: string;
  message: string;
  data: { model: string };
};

interface ItemIO {
  inputs: string;
  output1?: string;
  output2?: string;
}

export const Binarization: React.FC = () => {
  const { step } = useBinarizationStore();
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    // enforce step-based navigation; redirect route based on current step
    const base = '/binarization';
    const path = location.pathname;
    const target = step === 1 ? `${base}/upload` : step === 2 ? `${base}/models` : step === 3 ? `${base}/run` : `${base}/results`;
    // if user navigates elsewhere, redirect to current step
    if (!path.startsWith(target)) navigate(target, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const steps = [
    { id: 1, title: 'Upload', description: 'JSON 업로드 및 유효성 확인' },
    { id: 2, title: 'Model Selection', description: '타겟 능력 선택 및 후보 비교' },
    { id: 3, title: 'Run Inference', description: '선택한 두 모델로 배치 실행' },
    { id: 4, title: 'Review Results', description: '결과 확인/내보내기' },
  ];

  return (
    <div className="py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Automated Binarization Module</h2>
        <p className="mt-1 text-gray-600 dark:text-gray-300">업로드 → 최적모델 선택 → 모델 실행 → 결과 확인</p>
      </div>
      <ProgressIndicator currentStep={step} stepsOverride={steps} />
      <Outlet />
    </div>
  );
};
export default Binarization;


