/**
 * @fileoverview Панель режима обучения: шаг, прогресс, Далее
 * @module components/editor/scenariy/learn/ScenariyLearnPanel
 */

import { Button } from '@/components/ui/button';
import { TypewriterText } from '@/components/editor/auth/TypewriterText';
import { cn } from '@/utils/utils';
import type { ScenariyLearnStep } from './scenariy-learn-steps';

/** Пропсы панели */
export interface ScenariyLearnPanelProps {
  /** Текущий шаг */
  step: ScenariyLearnStep;
  /** Номер шага (1-based) */
  stepNumber: number;
  /** Всего шагов */
  totalSteps: number;
  /** Реплика допечатана */
  lineReady: boolean;
  /** Последний шаг */
  isLast: boolean;
  /** Первый шаг */
  isFirst: boolean;
  /** Реплика допечатана */
  onLineDone: () => void;
  /** Далее */
  onNext: () => void;
  /** Назад */
  onBack: () => void;
  /** Пропустить обучение */
  onSkip: () => void;
}

/**
 * Панель «Режим обучения» с шагами
 * @param props - Свойства
 * @returns JSX элемент
 */
export function ScenariyLearnPanel({
  step,
  stepNumber,
  totalSteps,
  lineReady,
  isLast,
  isFirst,
  onLineDone,
  onNext,
  onBack,
  onSkip,
}: ScenariyLearnPanelProps) {
  return (
    <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-3 space-y-3 mb-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-primary/15 text-primary">
            Режим обучения
          </span>
          <span className="text-xs text-muted-foreground truncate">
            Шаг {stepNumber} из {totalSteps}
            <span className="mx-1.5 text-border">·</span>
            {step.title}
          </span>
        </div>
        {!isLast ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground shrink-0"
            onClick={onSkip}
          >
            Пропустить
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground shrink-0">Почти готово</span>
        )}
      </div>

      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors duration-300',
              i < stepNumber ? 'bg-primary' : 'bg-border/60',
            )}
          />
        ))}
      </div>

      <p className="text-sm text-foreground/90 min-h-[4.5rem] leading-relaxed">
        <TypewriterText
          key={step.id}
          text={step.text}
          delayMs={60}
          speedMs={22}
          onDone={onLineDone}
        />
      </p>

      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFirst}
          onClick={onBack}
          className={cn(isFirst && 'opacity-40')}
        >
          Назад
        </Button>

        {isLast ? (
          <Button
            type="button"
            size="sm"
            disabled={!lineReady}
            onClick={onSkip}
            className={cn(
              'transition-all duration-300',
              lineReady ? 'opacity-100' : 'opacity-40',
            )}
          >
            Я понял
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={!lineReady}
            onClick={onNext}
            className={cn(
              'transition-all duration-300',
              lineReady ? 'opacity-100' : 'opacity-40',
            )}
          >
            Далее
          </Button>
        )}
      </div>
    </div>
  );
}
