import React from 'react';
import { CheckCircle, Circle } from 'lucide-react';
import { Task } from '../../../../types/tasks';
import { format } from 'date-fns';
import { useDispatch } from 'react-redux';
import { updateTaskStep } from '../../../../store/slices/tasksSlice';

interface StepsListProps {
  task: Task;
}

export function StepsList({ task }: StepsListProps) {
  const dispatch = useDispatch();

  const handleStepToggle = (stepId: string, currentStatus: boolean) => {
    dispatch(updateTaskStep({
      taskId: task.id,
      stepId,
      completed: !currentStatus
    }));
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900">Этапы задачи</h3>
      <div className="space-y-3">
        {task.steps.map((step) => (
          <div 
            key={step.id}
            className={`p-4 rounded-xl border transition-all duration-300 ease-in-out transform ${
              step.isCompleted
                ? 'bg-green-50 border-green-200 scale-[0.98]'
                : 'bg-white border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => handleStepToggle(step.id, step.isCompleted)}
                className={`mt-0.5 transition-transform duration-300 ease-in-out transform ${
                  step.isCompleted ? 'scale-110' : 'hover:scale-105'
                }`}
              >
                {step.isCompleted ? (
                  <div className="relative">
                    <CheckCircle className="h-5 w-5 text-green-600 animate-checkmark" />
                    <div className="absolute inset-0 bg-green-200 rounded-full animate-ripple" />
                  </div>
                ) : (
                  <Circle className="h-5 w-5 text-gray-400" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className={`font-medium break-words transition-colors duration-300 ${
                      step.isCompleted ? 'text-green-700' : 'text-gray-900'
                    }`}>
                      {step.name}
                    </h4>
                    {step.comments && (
                      <p className={`text-sm break-words transition-colors duration-300 ${
                        step.isCompleted ? 'text-green-600' : 'text-gray-600'
                      }`}>
                        {step.comments}
                      </p>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {format(new Date(step.startDate), 'dd.MM.yyyy HH:mm')} -<br />
                    {format(new Date(step.endDate), 'dd.MM.yyyy HH:mm')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}