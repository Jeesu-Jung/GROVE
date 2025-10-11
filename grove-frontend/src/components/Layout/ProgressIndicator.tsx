import React from 'react';
import { Check } from 'lucide-react';

interface ProgressIndicatorProps {
  currentStep: number;
  stepsOverride?: { id: number; title: string; description: string }[];
}

const defaultSteps = [
  { id: 1, title: 'Upload Dataset', description: 'Import and configure data' },
  { id: 2, title: 'Statistics', description: 'Analyze text metrics' },
  { id: 3, title: 'Domain Analysis', description: 'Extract with LLM' },
  { id: 4, title: 'Sampling', description: 'Select and export' },
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ currentStep, stepsOverride }) => {
  const steps = stepsOverride ?? defaultSteps;
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between">
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
                className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
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