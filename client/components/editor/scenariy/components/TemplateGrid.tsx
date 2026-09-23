/**
 * @fileoverview Компонент сетки карточек сценариев
 * @module client/components/editor/scenariy/components/TemplateGrid
 */

import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/utils';
import { TemplateCard } from './TemplateCard';
import { TemplateEmptyState } from './TemplateEmptyState';
import type { TemplateGridProps } from '../types/scenariy-tipy';

/** Макс. карточек с индивидуальной задержкой */
const MAX_STAGGER = 12;
/** Шаг задержки между карточками (мс) */
const STAGGER_STEP_MS = 70;

/**
 * Сетка карточек с опциональным каскадным появлением
 * @param props - свойства компонента
 * @returns JSX элемент сетки
 */
export function TemplateGrid({
  templates,
  isLoading,
  onUse,
  showDelete,
  onDelete,
  staggerReveal = false,
  reveal = true,
  baseDelayMs = 420,
}: TemplateGridProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (templates.length === 0) {
    return <TemplateEmptyState />;
  }

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2 xs:gap-2.5 sm:gap-3 md:gap-4 lg:gap-5">
      {templates.map((template, index) => {
        if (!template || typeof template.id === 'undefined') return null;

        const step = Math.min(index, MAX_STAGGER);
        const delayMs = baseDelayMs + step * STAGGER_STEP_MS;

        return (
          <div
            key={template.id}
            className={cn(
              staggerReveal && 'transition-all duration-500 ease-out',
              staggerReveal &&
                (reveal
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-3 scale-95 pointer-events-none'),
            )}
            style={
              staggerReveal
                ? { transitionDelay: reveal ? `${delayMs}ms` : '0ms' }
                : undefined
            }
          >
            <TemplateCard
              template={template}
              onUse={onUse}
              showDelete={showDelete}
              onDelete={onDelete}
              animateButton={staggerReveal && reveal}
              buttonDelayMs={delayMs + 180}
            />
          </div>
        );
      })}
    </div>
  );
}
