/**
 * @fileoverview Компактные чипы проблем доставки: блок, удаление, прочие ошибки
 * @module client/components/editor/broadcast/components/delivery-problem-chips
 */

import { Ban, CircleAlert, CircleHelp, UserX, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Подсказка про статус «заблокировали бота» */
export const BLOCKED_USERS_HINT =
  'Пользователи, которые заблокировали бота. Если человек напишет боту, этот статус снимется.';

/**
 * Описание одного типа проблемы доставки
 */
interface ProblemChipItem {
  /** Количество записей этого типа */
  count: number;
  /** Иконка Lucide */
  icon: LucideIcon;
  /** Короткая подпись */
  label: string;
  /** Подсказка при наведении */
  title: string;
  /** Цветовые классы чипа */
  className: string;
  /** Показать значок подсказки */
  showHelp?: boolean;
}

/**
 * Пропсы чипов проблем доставки
 */
interface DeliveryProblemChipsProps {
  /** Заблокировали бота */
  blocked?: number;
  /** Аккаунт удалён */
  deleted?: number;
  /** Прочие ошибки */
  failed?: number;
  /** Показывать текстовые подписи рядом с числом */
  showLabels?: boolean;
  /** Размер чипа: sm — в строке бота, md — в шапке списка ошибок */
  size?: 'sm' | 'md';
}

/**
 * Собирает чипы только для ненулевых счётчиков
 * @param blocked - Заблокировали бота
 * @param deleted - Аккаунт удалён
 * @param failed - Прочие ошибки
 * @returns Список чипов для отрисовки
 */
function buildChips(blocked: number, deleted: number, failed: number): ProblemChipItem[] {
  return [
    {
      count: blocked,
      icon: Ban,
      label: 'Блок',
      title: BLOCKED_USERS_HINT,
      className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
      showHelp: true,
    },
    {
      count: deleted,
      icon: UserX,
      label: 'Удалены',
      title: 'Аккаунт удалён или не найден',
      className: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
    },
    {
      count: failed,
      icon: CircleAlert,
      label: 'Прочие',
      title: 'Прочие ошибки доставки',
      className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    },
  ].filter((item) => item.count > 0);
}

/**
 * Значок «?» с подсказкой про статус блокировки
 * @param text - Текст подсказки
 * @param compact - Компактный размер иконки
 * @returns JSX элемент
 */
function ChipHelp({ text, compact }: { text: string; compact: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={text}
          className="inline-flex shrink-0 opacity-70 hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <CircleHelp className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs leading-snug">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Ряд цветных чипов с иконками вместо эмодзи
 * @param props - Счётчики и режим подписей
 * @returns JSX элемент или null, если проблем нет
 */
export function DeliveryProblemChips({
  blocked = 0,
  deleted = 0,
  failed = 0,
  showLabels = false,
  size = 'sm',
}: DeliveryProblemChipsProps) {
  const chips = buildChips(blocked, deleted, failed);
  if (chips.length === 0) return null;
  const isMd = size === 'md';

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {chips.map((item) => {
        const Icon = item.icon;
        return (
          <span
            key={item.label}
            title={item.showHelp ? undefined : item.title}
            className={`inline-flex items-center font-medium tabular-nums ${item.className} ${
              isMd ? 'gap-1.5 rounded-md px-2 py-1 text-xs' : 'gap-1 rounded-md px-1.5 py-0.5 text-[11px]'
            }`}
          >
            <Icon className={isMd ? 'h-3.5 w-3.5 shrink-0' : 'h-3 w-3 shrink-0'} />
            {showLabels && <span>{item.label}</span>}
            <span>{item.count}</span>
            {item.showHelp && <ChipHelp text={item.title} compact={!isMd} />}
          </span>
        );
      })}
    </span>
  );
}
