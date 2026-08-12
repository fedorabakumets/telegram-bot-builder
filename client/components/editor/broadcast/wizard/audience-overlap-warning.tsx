/**
 * @fileoverview Предупреждение о людях, которые получат сообщение от нескольких ботов
 * @module client/components/editor/broadcast/wizard/audience-overlap-warning
 */

import { AlertTriangle } from 'lucide-react';

/**
 * Пропсы компонента AudienceOverlapWarning
 */
interface AudienceOverlapWarningProps {
  /** Сколько людей получат сообщение более одного раза */
  overlapEstimate: number;
}

/**
 * Склоняет слово «человек» по числу получателей
 * @param count - Количество людей
 * @returns Слово в нужной форме
 */
function pluralizePeople(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return 'человек получит';
  return 'человек получат';
}

/**
 * Плашка-предупреждение о пересечении аудиторий выбранных ботов.
 * Ничего не рендерит, если пересечения нет.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент предупреждения или null
 */
export function AudienceOverlapWarning({ overlapEstimate }: AudienceOverlapWarningProps) {
  if (overlapEstimate <= 0) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-amber-300/50 dark:border-amber-700/40 bg-amber-500/10 px-3 py-2">
      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800 dark:text-amber-200">
        {overlapEstimate.toLocaleString('ru-RU')} {pluralizePeople(overlapEstimate)} сообщение
        от нескольких ботов
      </p>
    </div>
  );
}
