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
  /** Обработчик двойного клика для начала редактирования */
  onDoubleClick: () => void;
}

/**
 * Компонент отображения маскированного токена с подсказкой
 */
export function TokenDisplay({ token, onDoubleClick }: TokenDisplayProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p
          className="font-mono text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors break-all flex items-center gap-1.5 group"
          onDoubleClick={onDoubleClick}
          title="Двойной клик для изменения токена"
          aria-label="Токен бота — двойной клик для редактирования"
        >
          <span className="flex-1">Токен: {maskToken(token)}</span>
          <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
        </p>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Двойной клик для изменения токена</p>
      </TooltipContent>
    </Tooltip>
  );
}
