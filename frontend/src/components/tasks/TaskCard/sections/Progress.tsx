import React from 'react';

interface ProgressProps {
  completedSteps: number;
  totalSteps: number;
  progress: number;
  styles: {
    progress: string;
  };
}

export function Progress({
  completedSteps,
  totalSteps,
  progress,
  styles
}: ProgressProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <div className="h-2 bg-black/5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ease-out transform origin-left ${styles.progress}`}
            style={{ 
              width: `${progress}%`,
              transform: `scaleX(${progress === 0 ? 0 : 1})` 
            }}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-gray-700">
          {completedSteps}
        </div>
        <div className="text-sm text-gray-500">
          из {totalSteps} этапов
        </div>
      </div>
    </div>
  );
}