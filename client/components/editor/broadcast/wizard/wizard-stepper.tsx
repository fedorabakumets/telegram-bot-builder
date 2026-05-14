/**
 * @fileoverview Индикатор шагов (stepper) для wizard рассылки
 * @module client/components/editor/broadcast/wizard/wizard-stepper
 */

import { Check } from 'lucide-react';
import { cn } from '@/utils/utils';

/**
 * Пропсы компонента WizardStepper
 */
interface WizardStepperProps {
  /** Названия шагов */
  steps: string[];
  /** Текущий активный шаг (1-based) */
  currentStep: number;
}

/**
 * Визуальный индикатор прогресса по шагам wizard
 * @param props - Свойства компонента
 * @returns JSX элемент stepper
 */
export function WizardStepper({ steps, currentStep }: WizardStepperProps) {
  return (
    <div className="flex items-center justify-center gap-2 pb-2">
      {steps.map((label, idx) => {
        const stepNum = idx + 1;
        const isActive = stepNum === currentStep;
        const isCompleted = stepNum < currentStep;

        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                  isCompleted && 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-md',
                  isActive && 'bg-gradient-to-br from-blue-500 to-violet-500 text-white shadow-lg scale-110',
                  !isActive && !isCompleted && 'bg-muted text-muted-foreground',
                )}
              >
                {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
              </div>
              <span className={cn(
                'text-[10px] leading-tight',
                isActive ? 'text-foreground font-medium' : 'text-muted-foreground',
              )}>
                {label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className={cn(
                'w-8 h-0.5 rounded-full mb-4',
                stepNum < currentStep ? 'bg-gradient-to-r from-blue-500 to-violet-500' : 'bg-muted',
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
