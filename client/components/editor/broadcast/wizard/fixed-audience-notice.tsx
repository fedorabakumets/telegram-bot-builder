/** @fileoverview Подпись зафиксированных получателей перед редактированием и подтверждением рассылки. */
import { Users } from 'lucide-react';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { formatBotShortLabel } from '../utils/format-bot-label';
import type { FixedBroadcastAudience } from '../utils/fixed-audience';

/**
 * Показывает точное число получателей и бота без возможности случайно расширить аудиторию.
 * @param props - Проект и выбранный список
 * @returns Компактная подпись аудитории
 */
export function FixedAudienceNotice({ projectId, audience }: {
  /** Проект рассылки. */ projectId: number;
  /** Список, скопированный из поиска. */ audience: FixedBroadcastAudience;
}) {
  const projects = useProjectTokens([projectId]);
  const token = projects[0]?.tokens?.find(item => item.id === audience.tokenId);
  return <div className="space-y-1 border-b border-border px-3 py-2 text-xs sm:px-6" aria-label="Получатели рассылки">
    <p className="flex flex-wrap items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />
      <span>{audience.label}: <strong>{audience.userIds.length.toLocaleString('ru-RU')}</strong></span>
      <span className="text-muted-foreground">{formatBotShortLabel(token, audience.tokenId)}</span>
    </p>
    <p className="text-muted-foreground">Сообщение получат только эти пользователи.</p>
  </div>;
}
