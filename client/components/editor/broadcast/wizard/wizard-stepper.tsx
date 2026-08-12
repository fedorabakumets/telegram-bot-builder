/**
 * @fileoverview Stepper мастера рассылки с кликабельными доступными шагами
 * @module client/components/editor/broadcast/wizard/wizard-stepper
 */

import { Check } from 'lucide-react';
import { cn } from '@/utils/utils';

/** Пропсы stepper */
interface WizardStepperProps {
  /** Названия шагов */
  steps: string[];
  /** Текущий шаг (1-based) */
  currentStep: number;
  /** Только кружки без подписей (мобильная строка) */
  compact?: boolean;
  /** Клик по доступному шагу */
  onStepClick?: (step: number) => void;
  /** Можно ли перейти на шаг (иначе не кликабелен) */
  isStepEnabled?: (step: number) => boolean;
}

/**
 * Индикатор шагов wizard; доступные шаги — кнопки
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function WizardStepper({
  steps,
  currentStep,
  compact = false,
  onStepClick,
  isStepEnabled,
}: WizardStepperProps) {
  return (
    <nav aria-label="Шаги рассылки" className={cn('w-full', compact && 'w-auto')}>
      <ol className={cn('flex items-center', compact ? 'gap-0' : 'w-full items-start')}>
        {steps.map((label, idx) => {
          const stepNum = idx + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          const isLast = idx === steps.length - 1;
          const enabled = !!onStepClick && !!isStepEnabled?.(stepNum) && !isActive;

          const circleClass = cn(
            'flex items-center justify-center rounded-full font-semibold transition-colors',
            compact ? 'h-6 w-6 text-[11px]' : 'relative z-[1] h-8 w-8 text-xs',
            isCompleted && 'bg-primary text-primary-foreground',
            isActive && 'bg-primary text-primary-foreground',
            isActive && !compact && 'shadow-[0_0_0_4px] shadow-primary/15',
            !isActive && !isCompleted && 'border border-border bg-background text-muted-foreground',
            enabled && 'cursor-pointer hover:ring-2 hover:ring-primary/30',
            !enabled && !isActive && stepNum > currentStep && 'opacity-70',
          );

          const circle = (
            <span className={circleClass}>
              {isCompleted ? (
                <Check className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} strokeWidth={2.5} />
              ) : (
                stepNum
              )}
            </span>
          );

          const control = enabled ? (
            <button
              type="button"
              onClick={() => onStepClick?.(stepNum)}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Перейти к шагу: ${label}`}
            >
              {circle}
            </button>
          ) : (
            circle
          );

          if (compact) {
            return (
              <li key={label} className="flex items-center">
                {control}
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn('mx-1.5 h-px w-4', isCompleted ? 'bg-primary/55' : 'bg-border')}
                  />
                )}
              </li>
            );
          }

          return (
            <li key={label} className="relative flex flex-1 flex-col items-center">
              <div className="relative flex w-full items-center justify-center">
                {!isLast && (
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-[calc(50%+1rem)] right-[calc(-50%+1rem)] top-1/2 h-px -translate-y-1/2',
                      isCompleted ? 'bg-primary/55' : 'bg-border',
                    )}
                  />
                )}
                {control}
              </div>
              {enabled ? (
                <button
                  type="button"
                  onClick={() => onStepClick?.(stepNum)}
                  className={cn(
                    'mt-2 max-w-full truncate px-1 text-center text-xs leading-tight hover:text-foreground',
                    'text-muted-foreground',
                  )}
                >
                  {label}
                </button>
              ) : (
                <span
                  className={cn(
                    'mt-2 px-1 text-center text-xs leading-tight',
                    isActive ? 'font-medium text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
