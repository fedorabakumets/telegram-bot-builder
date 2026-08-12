/**
 * @fileoverview Подпись: из какого проекта и от каких ботов берётся аудитория рассылки
 * @module client/components/editor/broadcast/wizard/audience-context-hint
 */

import { Bot, FolderKanban } from 'lucide-react';
import { useProject } from '@/components/editor/database/user-database/hooks/queries/use-project';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { formatBotLabel, formatBotShortLabel, pluralizeBots } from '../utils/format-bot-label';

/**
 * Пропсы подсказки контекста аудитории
 */
interface AudienceContextHintProps {
  /** ID текущего проекта */
  projectId: number;
  /** ID выбранного токена бота */
  tokenId?: number | null;
  /** ID ботов, выбранных в форме рассылки */
  selectedTokenIds?: number[];
}

/**
 * Компактная плашка: аудитория = пользователи этого проекта и выбранных ботов.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function AudienceContextHint({ projectId, tokenId, selectedTokenIds }: AudienceContextHintProps) {
  const { project } = useProject({ projectId });
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];

  /** Боты, выбранные в форме; при пустом выборе — режим одного бота */
  const selectedTokens = (selectedTokenIds ?? [])
    .map((id) => tokens.find((token) => token.id === id))
    .filter((token): token is NonNullable<typeof token> => Boolean(token));

  const fallbackToken =
    (tokenId != null ? tokens.find((t) => t.id === tokenId) : undefined) ??
    tokens.find((t) => t.isDefault === 1) ??
    tokens[0];

  const isMulti = selectedTokens.length > 1;
  const botLabel = isMulti
    ? `${selectedTokens.length} ${pluralizeBots(selectedTokens.length)}: ${selectedTokens.map((token) => formatBotShortLabel(token)).join(', ')}`
    : formatBotLabel(selectedTokens[0] ?? fallbackToken);

  const projectLabel = project?.name?.trim() || `Проект #${projectId}`;

  return (
    <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5 text-sm space-y-1.5">
      <p className="text-xs text-muted-foreground">
        {isMulti
          ? 'Получатели — пользователи проекта у каждого выбранного бота'
          : 'Получатели — пользователи выбранного проекта и бота'}
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
