/**
 * @fileoverview Панель переменных окружения бота (режим «Переменные»)
 *
 * Отображает все переменные окружения в виде таблицы key=value
 * с возможностью добавления, редактирования и удаления.
 *
 * @module BotEnvPanel
 */

import { Braces } from 'lucide-react';

/** Свойства панели переменных окружения */
interface BotEnvPanelProps {
  /** ID проекта */
  projectId: number;
  /** ID токена */
  tokenId: number;
}

/**
 * Панель переменных окружения бота (заглушка — полная реализация в этапе 4)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvPanel({ projectId, tokenId }: BotEnvPanelProps) {
  return (
    <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-4 text-center">
      <Braces className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
      <p className="text-sm text-muted-foreground">
        Панель переменных окружения
      </p>
      <p className="text-xs text-muted-foreground/60 mt-1">
        Token #{tokenId} · Project #{projectId}
      </p>
    </div>
  );
}
