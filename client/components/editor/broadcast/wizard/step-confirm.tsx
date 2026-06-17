/**
 * @fileoverview Шаг 3 wizard: подтверждение перед запуском рассылки
 * @module client/components/editor/broadcast/wizard/step-confirm
 */

import { useMemo } from 'react';
import { Tag, Users, Clock, MessageSquare, Rocket, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudiencePreview } from '../hooks/use-audience-preview';
import { BroadcastMessagePreview } from '../components/broadcast-message-preview';
import { BroadcastValidationAlerts } from '../components/broadcast-validation-alerts';
import { validateBroadcastMessage } from '../utils/validate-broadcast-message';
import type { NewBroadcastFormData } from '../types';

/**
 * Пропсы компонента StepConfirm
 */
interface StepConfirmProps {
  /** Идентификатор проекта */
  projectId: number;
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
export function StepConfirm({ projectId, formData, isLoading, onConfirm, onBack }: StepConfirmProps) {
  const { audienceType, ...filterFields } = formData.filters;
  /**
   * Фильтры для preview-аудитории. Для ручного выбора передаём userIds,
   * иначе сервер посчитает всех пользователей и счётчик будет неверным.
   */
  const apiFilters = audienceType === 'tags' ? { tags: filterFields.tags } :
    audienceType === 'date' ? { registeredFrom: filterFields.registeredFrom, registeredTo: filterFields.registeredTo } :
    audienceType === 'activity' ? { activeFrom: filterFields.activeFrom, activeTo: filterFields.activeTo } :
    audienceType === 'manual' ? { userIds: filterFields.userIds ?? [] } : {};

  const { count, isLoading: isCountLoading } = useAudiencePreview(projectId, apiFilters);

  /**
   * Итоговое число получателей. Для ручного выбора берём длину userIds,
   * т.к. при пустом массиве preview на сервере вернул бы всех пользователей.
   */
  const recipientCount = audienceType === 'manual'
    ? (filterFields.userIds?.length ?? 0)
    : count;

  const estimatedSeconds = recipientCount > 0 ? Math.ceil(recipientCount / SEND_RATE) : 0;
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

      {/* Таблица параметров */}
      <div className="rounded-xl border shadow-sm divide-y text-sm overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <Tag className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="text-muted-foreground">Название</span>
          <span className="ml-auto font-medium">{formData.name}</span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Users className="w-4 h-4 text-violet-500 shrink-0" />
          <span className="text-muted-foreground">Получателей</span>
          <span className="ml-auto font-medium">
            {audienceType === 'manual'
              ? recipientCount.toLocaleString('ru-RU')
              : (isCountLoading ? '...' : count.toLocaleString('ru-RU'))}
          </span>
        </div>
        <div className="flex items-center gap-3 px-4 py-3">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-muted-foreground">Примерное время</span>
          <span className="ml-auto font-medium">
            {estimatedSeconds > 0 ? `~${estimatedSeconds} сек` : '—'}
          </span>
        </div>
        {(formData.filters.groupIds?.length ?? 0) > 0 && (
          <div className="flex items-center gap-3 px-4 py-3">
            <Layers className="w-4 h-4 text-fuchsia-500 shrink-0" />
            <span className="text-muted-foreground">Группы</span>
            <span className="ml-auto font-medium">{formData.filters.groupIds!.length}</span>
          </div>
        )}
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-green-500 shrink-0" />
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
          disabled={isLoading || recipientCount === 0 || !validation.isValid}
          className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 gap-1.5 px-5"
        >
          <Rocket className="w-4 h-4" />
          {isLoading ? 'Запуск...' : 'Запустить рассылку'}
        </Button>
      </div>
    </div>
  );
}
