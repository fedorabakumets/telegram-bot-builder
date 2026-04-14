/**
 * @fileoverview Секция гостевого пользователя
 * @description Отображает статус гостя и кнопку входа через Telegram
 */

import { cn } from '@/utils/utils';

/** Признак dev-режима на клиенте */
const IS_DEV = import.meta.env.MODE === 'development';

/**
 * Свойства секции гостя
 */
export interface GuestSectionProps {
  /** Обработчик нажатия кнопки входа */
  onLogin?: () => void;
  /** Вертикальное расположение */
  isVertical?: boolean;
}

/**
 * Секция гостевого режима: бейдж «Гость» и кнопка входа через Telegram
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function GuestSection({ onLogin, isVertical }: GuestSectionProps) {
  return (
    <div className={cn(
      'flex items-center gap-2',
      isVertical ? 'w-full flex-col' : 'flex-row'
    )}>
      {/* Бейдж гостя или dev-режима */}
      <div className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg backdrop-blur-md border shadow-md',
        IS_DEV
          ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/10 dark:from-amber-700/25 dark:to-orange-600/20 border-amber-400/30 dark:border-amber-500/40'
          : 'bg-gradient-to-r from-slate-500/15 to-slate-400/10 dark:from-slate-700/25 dark:to-slate-600/20 border-slate-400/20 dark:border-slate-500/30',
        isVertical ? 'w-full justify-center' : ''
      )}>
        <span className="text-sm">{IS_DEV ? '🛠️' : '👤'}</span>
        <span className={cn('text-xs font-medium', IS_DEV ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
          {IS_DEV ? 'Dev' : 'Гость'}
        </span>
      </div>

      {/* Кнопка входа */}
      <button
        onClick={onLogin}
        className={cn(
          'flex items-center gap-1.5 bg-gradient-to-r from-blue-500/15 to-cyan-500/10 dark:from-blue-700/25 dark:to-cyan-600/20',
          'px-3 py-1.5 rounded-lg backdrop-blur-md border border-blue-400/20 dark:border-blue-500/30 shadow-md shadow-blue-500/10',
          'text-xs font-medium text-blue-600 dark:text-blue-400 hover:from-blue-500/25 hover:to-cyan-500/20 transition-all',
          isVertical ? 'w-full justify-center' : ''
        )}
      >
        Войти в Telegram
      </button>
    </div>
  );
}
