/**
 * @fileoverview Компонент отображения токена
 *
 * Отображает маскированный токен с иконкой редактирования при ховере.
 * Поддерживает двойной клик для перехода в режим редактирования.
 *
 * @module TokenDisplay
 */

import { Pencil } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { maskToken } from './tokenUtils';

/**
 * Свойства компонента отображения токена
 */
interface TokenDisplayProps {
  /** Токен бота */
  token: string;
  /** Обработчик открытия редактора. */
  onEdit: () => void;
  /** Скрыть префикс «Токен:» — заголовок уже есть в секции настроек */
  hidePrefix?: boolean;
}

/**
 * Маскированный токен с кнопкой открытия редактора.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TokenDisplay({ token, onEdit, hidePrefix = false }: TokenDisplayProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="font-mono text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors break-all flex items-center gap-1.5 group"
          onClick={onEdit}
          aria-label="Редактировать токен бота"
        >
          <span className="flex-1">
            {hidePrefix ? maskToken(token) : `Токен: ${maskToken(token)}`}
          </span>
          <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Редактировать токен бота</p>
      </TooltipContent>
    </Tooltip>
  );
}
