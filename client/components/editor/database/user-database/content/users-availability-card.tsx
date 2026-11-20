/** @fileoverview Компактная доступность сообщений по тем же счётчикам, что и фильтр пользователей. */
import { DeleteWithoutPrivateButton } from './delete-without-private-button';
import { AnalyticsAccessCheckPanel } from '@/components/editor/analytics/analytics-access-check-panel';
import { useDirectoryControls } from './user-directory-controls';
import './users-availability.css';
import { UsersTelegramBotCheckButton } from './users-telegram-bot-check-button';
import { UsersBotAvailabilitySummary } from './users-bot-availability-summary';
import { statusAppearance } from '@shared/status-appearance';
/**
 * Показывает текущие счётчики фильтра и управление проверкой без отдельного снимка аналитики.
 * @param props - Текущий проект и выбранный бот.
 * @returns Компактная строка показателей и живой прогресс проверки.
 */
export function UsersAvailabilityCard({ projectId, tokenId, totalUsers }: {
  /** Проект пользователей. */ projectId: number;
  /** Конкретный бот либо все боты проекта. */ tokenId: number | null;
  /** Количество личных контактов в текущем списке без поисковых фильтров. */ totalUsers?: number;
}) {
  const counts = useDirectoryControls()?.result?.statusCounts;
  /** Импортированные контакты без переписки учитываются отдельно от подтверждённой доступности. */
  const unverified = counts?.unverified ? [['Не проверены', counts.unverified]] : [];
  /** В общей области учитываются люди без единого доступного бота, а не сумма аудиторий проблемных ботов. */
  const unavailableLabel = tokenId ? 'Бот недоступен для пользователей' : 'Нет доступных ботов у пользователя';
  /** Дополнительный счётчик поясняет пересечение аудиторий, не складывается со статусами. */
  const otherBots = counts?.otherAvailableBots ? [[tokenId ? 'Этот бот недоступен, но есть другие доступные боты' : 'Есть недоступные и доступные боты', counts.otherAvailableBots]] : [];
  /** Подписи сводки используют ту же палитру, что соответствующие статусы таблицы и фильтра. */
  function metricColor(label: string): string {
    const status = label === 'Активные' ? 'Активен' : label === 'Заблокировали бота' ? 'Пользователь заблокировал бота'
      : label === 'Удалённые аккаунты' ? 'Аккаунт удалён' : label === unavailableLabel ? unavailableLabel
        : otherBots.some(([name]) => name === label) ? 'Активен' : null;
    return statusAppearance(status).color;
  }
  return <section className="users-availability-card" aria-label="Доступность личных сообщений">
    <h3 className="sr-only">Доступность личных сообщений</h3>
    <div className="users-availability-summary"><div className="users-availability-line"><dl>{[['Активные', counts?.active], ['Заблокировали бота', counts?.blocked],
      ['Удалённые аккаунты', counts?.deleted], [unavailableLabel, counts?.botUnavailable], ...otherBots, ...unverified].map(([label, count]) => <div key={label}>
      <dt style={{ color: metricColor(String(label)) }}>{label}</dt><dd style={{ color: metricColor(String(label)) }}>{count == null ? '—' : Number(count).toLocaleString('ru-RU')}</dd>
    </div>)}</dl></div>
      <div className="users-availability-line"><UsersBotAvailabilitySummary projectId={projectId} tokenId={tokenId} /></div>
    </div>
    {/** Удаления образуют левую колонку, проверки — правую, по две кнопки друг под другом. */}
    <div className="users-availability-actions"><div className="users-availability-action-column">
      <DeleteWithoutPrivateButton kind="deleted" key={`deleted:${projectId}:${tokenId}`} projectId={projectId} tokenId={tokenId} />
      <DeleteWithoutPrivateButton key={`delete:${projectId}:${tokenId}`} projectId={projectId} tokenId={tokenId} />
    </div><div className="users-availability-action-column">
      <AnalyticsAccessCheckPanel projectId={projectId} tokenId={tokenId} totalUsers={totalUsers ?? 0}
        showSummary={false} overlayClassName="users-portal" />
      <UsersTelegramBotCheckButton key={`${projectId}:${tokenId ?? 'all'}`} projectId={projectId} tokenId={tokenId} />
    </div></div>
  </section>;
}
