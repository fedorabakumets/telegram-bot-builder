/**
 * @fileoverview Компонент отображения токена
 *
 * Отображает маскированный токен с возможностью редактирования.
 *
 * @module TokenDisplay
 */

import { maskToken } from './tokenUtils';

interface TokenDisplayProps {
  token: string;
  onDoubleClick: () => void;
}

/**
 * Компонент отображения токена
 */
export function TokenDisplay({ token, onDoubleClick }: TokenDisplayProps) {
  return (
    <p
      className="text-xs text-muted-foreground cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors break-all"
      onDoubleClick={onDoubleClick}
      title="Double-click to edit token"
    >
      Токен: {maskToken(token)}
    </p>
  );
}
