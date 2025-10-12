import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useBinarizationStore } from '../store/useBinarizationStore';
import { ProgressIndicator } from '../components/Layout/ProgressIndicator';

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
    { id: 1, title: 'Data Upload & Setting', description: 'Upload JSON and validate' },
    { id: 2, title: 'Model Pair Selection', description: 'Select target abilities and compare candidates' },
    { id: 3, title: 'Model Response Generation', description: 'Run batch with the two selected models' },
    { id: 4, title: 'Review Results', description: 'Review/export results' },
  ];

  return (
    <div className="py-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Automated Binarization Module</h2>
        <p className="mt-1 text-gray-600 dark:text-gray-300">Upload → Model selection → Run → Review results</p>
      </div>
      <ProgressIndicator currentStep={step} stepsOverride={steps} />
      <Outlet />
    </div>
  );
};
export default Binarization;


