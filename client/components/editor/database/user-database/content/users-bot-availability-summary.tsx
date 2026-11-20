/** @fileoverview Отдельные количества ботов проекта, не смешанные со счётчиками пользователей. */
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';
import type { BotToken } from '@shared/schema';
import { botAvailabilityLabel } from '@shared/bot-availability-label';
import { statusAppearance } from '@shared/status-appearance';
import { useProjectBotStatuses } from '@/components/editor/bot/hooks/use-project-bot-statuses';
/**
 * Читает тот же обновляемый справочник токенов, что и проверка ботов Telegram.
 * @param props - Текущий проект и выбранный бот.
 * @returns Статус выбранного бота либо общие счётчики проекта.
 */
export function UsersBotAvailabilitySummary({ projectId, tokenId = null }: {
  /** Проект ботов. */ projectId: number;
  /** Выбранный бот; null означает все боты. */ tokenId?: number | null;
}) {
  const { data } = useQuery<BotToken[]>({ queryKey: [`/api/projects/${projectId}/tokens`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens`), enabled: projectId > 0 });
  const unavailable = data?.filter(bot => Boolean(bot.authorizationError?.trim())).length;
  const selected = data?.find(bot => bot.id === tokenId);
  const runtime = useProjectBotStatuses(tokenId === null ? 0 : projectId);
  /** Учитывает потерю связи с исполнителем, когда нет ошибки Telegram. */
  const disconnected = runtime.data?.statuses.some(status =>
    (status.tokenId ?? status.instance?.tokenId) === tokenId && status.status === 'unknown');
  /** Общий статус и его цвет одинаковы в сводке, таблице и селекторе. */
  const label = selected ? botAvailabilityLabel(selected.authorizationError, selected.isActive)
    ?? (disconnected ? 'Нет связи' : 'Активен') : '—';
  if (tokenId !== null) return <dl aria-label="Доступность выбранного бота">
    <div><dt>Статус бота</dt><dd style={{ color: statusAppearance(label).color }}>{label}</dd></div>
  </dl>;
  return <dl aria-label="Доступность ботов проекта">
    <div><dt>Ботов в проекте</dt><dd>{data?.length.toLocaleString('ru-RU') ?? '—'}</dd></div>
    <div><dt>Недоступны в Telegram</dt><dd>{unavailable?.toLocaleString('ru-RU') ?? '—'}</dd></div>
  </dl>;
}
