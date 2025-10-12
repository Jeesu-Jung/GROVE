import React from 'react';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  stepsOverride?: { id: number; title: string; description: string }[];
}

const defaultSteps = [
  { id: 1, title: 'Upload Dataset', description: 'Data Upload & Setting' },
  { id: 2, title: 'Structure-based Statistics', description: 'text length, Instance size, etc.' },
  { id: 3, title: 'Content-based Statistics', description: 'task & domain automatic analysis' },
  { id: 4, title: 'Selection', description: 'Data- & Model-centric data Sampling' },
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, stepsOverride }) => {
  const steps = stepsOverride ?? defaultSteps;
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center relative">
              <div
                className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  step.id < currentStep
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : step.id === currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step.id < currentStep ? (
                  <Check className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-semibold">{step.id}</span>
                )}
              </div>
              <div className="mt-3 text-center">
                <div
                  className={`text-sm font-medium ${
                    step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {step.title}
                </div>
                <div
                  className={`text-xs mt-1 ${
                    step.id <= currentStep ? 'text-gray-600' : 'text-gray-400'
                  }`}
                >
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`mt-6 h-0.5 w-16 md:w-24 mx-4 rounded-full transition-all duration-300 ${
                  step.id < currentStep ? 'bg-emerald-500' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};