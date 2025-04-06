import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { TaskStep } from '../../../../types/tasks';
import { format } from 'date-fns';

interface StepsListProps {
  steps: TaskStep[];
  isExpanded: boolean;
  onStepToggle: (stepId: string) => void;
}

export function StepsList({ steps, isExpanded, onStepToggle }: StepsListProps) {
  return (
    <div
      className={`grid transition-all duration-500 ease-in-out ${
        isExpanded 
          ? 'grid-rows-[1fr] opacity-100 mt-4'
          : 'grid-rows-[0fr] opacity-0'
      }`}
    >
      <div className="overflow-hidden">
        <div className="space-y-3 border-t border-black/5 pt-4">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-500 ease-out transform ${
                step.isCompleted
                  ? 'bg-green-50/80 border border-green-100 scale-[0.99]'
                  : 'hover:bg-gray-50'
              }`}
            >
              <button
                onClick={() => onStepToggle(step.id)}
                className="relative mt-0.5 group"
                aria-label={step.isCompleted ? "Отметить как невыполненное" : "Отметить как выполненное"}
              >
                {step.isCompleted ? (
                  <div className="relative">
                    <CheckCircle className="h-5 w-5 text-green-600 transition-transform duration-300 animate-checkmark" />
                    <div className="absolute inset-0 bg-green-200 rounded-full animate-ripple" />
                  </div>
                ) : (
                  <div className="relative">
                    <Circle className="h-5 w-5 text-gray-400 transition-all duration-300 group-hover:scale-110 group-hover:text-gray-500" />
                    <div className="absolute inset-0 bg-gray-200 rounded-full opacity-0 group-hover:animate-ripple" />
                  </div>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className={`font-medium break-words transition-colors duration-300 ${
                      step.isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                    }`}>
                      {step.name}
                    </h4>
                    {step.comments && (
                      <p className={`text-sm break-words transition-colors duration-300 ${
                        step.isCompleted ? 'text-green-600/80' : 'text-gray-600'
                      }`}>
                        {step.comments}
                      </p>
                    )}
                  </div>
                  <div className={`text-xs whitespace-nowrap transition-colors duration-300 ${
                    step.isCompleted ? 'text-green-600/70' : 'text-gray-500'
                  }`}>
                    {format(new Date(step.startDate), 'dd.MM.yyyy HH:mm')} -<br />
                    {format(new Date(step.endDate), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}