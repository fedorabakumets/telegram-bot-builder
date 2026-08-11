/**
 * @fileoverview Подпись: из какого проекта и бота берётся аудитория рассылки
 * @module client/components/editor/broadcast/wizard/audience-context-hint
 */

import { Bot, FolderKanban } from 'lucide-react';
import type { BotToken } from '@shared/schema';
import { useProject } from '@/components/editor/database/user-database/hooks/queries/use-project';
import { useProjectTokens } from '@/hooks/use-project-tokens';

/**
 * Пропсы подсказки контекста аудитории
 */
interface AudienceContextHintProps {
  /** ID текущего проекта */
  projectId: number;
  /** ID выбранного токена бота */
  tokenId?: number | null;
}

/**
 * Читаемая подпись бота
 * @param token - Токен бота или undefined
 * @returns Строка для UI
 */
function formatBotLabel(token: BotToken | undefined): string {
  if (!token) return 'бот по умолчанию';
  if (token.botFirstName && token.botUsername) {
    return `${token.botFirstName} (@${token.botUsername})`;
  }
  if (token.botUsername) return `@${token.botUsername}`;
  if (token.botFirstName) return token.botFirstName;
  return token.name || `Бот #${token.id}`;
}

/**
 * Компактная плашка: аудитория = пользователи этого проекта и этого бота.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AudienceContextHint({ projectId, tokenId }: AudienceContextHintProps) {
  const { project } = useProject({ projectId });
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];
  const selected =
    (tokenId != null ? tokens.find((t) => t.id === tokenId) : undefined) ??
    tokens.find((t) => t.isDefault === 1) ??
    tokens[0];

  const projectLabel = project?.name?.trim() || `Проект #${projectId}`;
  const botLabel = formatBotLabel(selected);

  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm space-y-1.5">
      <p className="text-xs text-muted-foreground">
        Получатели — пользователи выбранного проекта и бота
      </p>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <FolderKanban className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="font-medium truncate">{projectLabel}</span>
        </span>
        <span className="text-muted-foreground hidden sm:inline">·</span>
        <span className="inline-flex items-center gap-1.5 min-w-0">
          <Bot className="w-3.5 h-3.5 text-violet-500 shrink-0" />
          <span className="font-medium truncate">{botLabel}</span>
        </span>
      </div>
    </div>
  );
}
