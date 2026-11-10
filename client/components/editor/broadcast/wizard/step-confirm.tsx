/**
 * @fileoverview Шаг 3 wizard: подтверждение перед запуском рассылки
 * @module client/components/editor/broadcast/wizard/step-confirm
 */

import { useMemo } from 'react';
import { Tag, Users, Clock, MessageSquare, Send, Layers, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProjectTokens } from '@/hooks/use-project-tokens';
import { isRetryAudienceReady } from '../utils/validate-retry-audience';
import { useAudiencePreview } from '../hooks/use-audience-preview';
import { BroadcastMessagePreview } from '../components/broadcast-message-preview';
import { BroadcastValidationAlerts } from '../components/broadcast-validation-alerts';
import { AudienceOverlapWarning } from './audience-overlap-warning';
import { validateBroadcastMessage } from '../utils/validate-broadcast-message';
import { resolveBroadcastDisplayName } from '../utils/resolve-broadcast-display-name';
import { formatBotShortLabel, pluralizeBots } from '../utils/format-bot-label';
import type { NewBroadcastFormData } from '../types';

/**
 * Пропсы компонента StepConfirm
 */
interface StepConfirmProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Идентификатор токена бота */
  tokenId?: number | null;
  /** Данные формы */
  formData: NewBroadcastFormData;
  /** Флаг загрузки (создание рассылки) */
  isLoading?: boolean;
  /** Запуск рассылки */
  onConfirm: () => void;
  /** Возврат к предыдущему шагу */
  onBack: () => void;
}

/** Скорость отправки сообщений (сообщений в секунду) */
const SEND_RATE = 25;

/**
 * Шаг подтверждения рассылки: показывает итоговую информацию перед запуском
 * @param props - Свойства компонента
 * @returns JSX элемент шага подтверждения
 */
export function StepConfirm({ projectId, tokenId, formData, isLoading, onConfirm, onBack }: StepConfirmProps) {
  const { audienceType, ...filterFields } = formData.filters;
  /**
   * Фильтры для preview-аудитории. Для ручного выбора передаём userIds,
   * иначе сервер посчитает всех пользователей и счётчик будет неверным.
   */
  const apiFilters = audienceType === 'tags' ? { tags: filterFields.tags } :
    audienceType === 'date' ? { registeredFrom: filterFields.registeredFrom, registeredTo: filterFields.registeredTo } :
    audienceType === 'activity' ? { activeFrom: filterFields.activeFrom, activeTo: filterFields.activeTo } :
    audienceType === 'manual' || audienceType === 'retry' ? { userIds: filterFields.userIds ?? [] } : {};

  const tokenIds = formData.tokenIds ?? [];
  const tokensInfo = useProjectTokens([projectId]);
  const tokens = tokensInfo[0]?.tokens ?? [];

  /** Подписи выбранных ботов для итоговой таблицы */
  const selectedBotLabels = tokenIds
    .map((id) => formatBotShortLabel(tokens.find((token) => token.id === id), id));

  const { count, perBot, overlapEstimate, isLoading: isCountLoading } = useAudiencePreview(
    projectId,
    apiFilters,
    tokenId,
    tokenIds,
  );

  /** Сервер исключает недоступные аккаунты и учитывает каждого выбранного бота. */
  const retryReady = isRetryAudienceReady(formData);
  const retryGroups = audienceType === 'retry' && retryReady ? formData.retryAudience?.groupIds.length ?? 0 : 0;
  const recipientCount = audienceType === 'retry' && !retryReady ? 0 : count + retryGroups;

  /**
   * Боты отправляют параллельно, поэтому время оценивается по самому
   * загруженному боту, а не по сумме всех получателей.
   */
  const slowestBotCount = perBot.length > 0
    ? Math.max(...perBot.map((item) => item.count)) + retryGroups
    : recipientCount;
  const estimatedSeconds = slowestBotCount > 0 ? Math.ceil(slowestBotCount / SEND_RATE) : 0;
  const validation = useMemo(() => validateBroadcastMessage(formData), [formData]);
  const hasMessageContent = Boolean(
    formData.messageText.trim()
    || (formData.mediaUrls?.length ?? 0) > 0
    || (formData.buttons?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-muted-foreground">Проверьте параметры рассылки</p>

      <BroadcastValidationAlerts validation={validation} />

      {audienceType !== 'manual' && <AudienceOverlapWarning overlapEstimate={overlapEstimate} />}

      {/* Таблица параметров */}
      <div className="rounded-xl border shadow-sm divide-y text-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Название</span>
          <span className="ml-auto font-medium text-right max-w-[70%] truncate">
            {resolveBroadcastDisplayName(formData.name, formData.messageText)}
          </span>
        </div>
        {selectedBotLabels.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Bot className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Боты</span>
            <span className="ml-auto font-medium text-right max-w-[70%] truncate">
              {selectedBotLabels.length} {pluralizeBots(selectedBotLabels.length)} · {selectedBotLabels.join(', ')}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 px-4 py-3">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Получателей</span>
          <span className="ml-auto font-medium">
            {isCountLoading ? '...' : recipientCount.toLocaleString('ru-RU')}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">Примерное время</span>
          <span className="ml-auto font-medium">
            {estimatedSeconds > 0 ? `~${estimatedSeconds} сек` : '—'}
          </span>
        </div>
        {(() => {
          const perTokenCount = Object.values(formData.groupsByTokenId ?? {})
            .reduce((sum, ids) => sum + (ids?.length ?? 0), 0);
          const legacyCount = formData.filters.groupIds?.length ?? 0;
          const groupsCount = perTokenCount || legacyCount;
          if (groupsCount === 0) return null;
          return (
            <div className="flex items-center gap-3 px-4 py-3">
              <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Группы</span>
              <span className="ml-auto font-medium">{groupsCount}</span>
            </div>
          );
        })()}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">Сообщение</span>
          </div>
          <div className="ml-6">
            {hasMessageContent ? (
              <BroadcastMessagePreview
                messageText={formData.messageText}
                mediaUrls={formData.mediaUrls}
                buttons={formData.buttons}
                buttonsPerRow={formData.buttonsPerRow}
                projectId={projectId}
                showLabel={false}
              />
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </div>
      </div>

      {/* Кнопки навигации */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>← Назад</Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading || isCountLoading || recipientCount === 0 || !validation.isValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 px-5"
        >
          <Send className="w-4 h-4" />
          {isLoading ? 'Запуск...' : 'Запустить рассылку'}
        </Button>
      </div>
    </div>
  );
}
