/**
 * @fileoverview Шаг 3 wizard: подтверждение перед запуском рассылки
 * @module client/components/editor/broadcast/wizard/step-confirm
 */

import { Button } from '@/components/ui/button';
import { useAudiencePreview } from '../hooks/use-audience-preview';
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
  const apiFilters = audienceType === 'tags' ? { tags: filterFields.tags } :
    audienceType === 'date' ? { registeredFrom: filterFields.registeredFrom, registeredTo: filterFields.registeredTo } :
    audienceType === 'activity' ? { activeFrom: filterFields.activeFrom, activeTo: filterFields.activeTo } : {};

  const { count, isLoading: isCountLoading } = useAudiencePreview(projectId, apiFilters);

  const estimatedSeconds = count > 0 ? Math.ceil(count / SEND_RATE) : 0;
  const plainText = formData.messageText.replace(/<[^>]+>/g, '');
  const preview = plainText.length > 100 ? plainText.slice(0, 100) + '...' : plainText;

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium">Проверьте параметры рассылки</p>

      <div className="border rounded-lg divide-y text-sm">
        <div className="flex justify-between px-4 py-2.5">
          <span className="text-muted-foreground">Название</span>
          <span className="font-medium">{formData.name}</span>
        </div>
        <div className="flex justify-between px-4 py-2.5">
          <span className="text-muted-foreground">Получателей</span>
          <span className="font-medium">
            {isCountLoading ? '...' : count.toLocaleString('ru-RU')}
          </span>
        </div>
        <div className="flex justify-between px-4 py-2.5">
          <span className="text-muted-foreground">Примерное время</span>
          <span className="font-medium">
            {estimatedSeconds > 0 ? `~${estimatedSeconds} сек` : '—'}
          </span>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-muted-foreground mb-1">Текст сообщения</p>
          <p className="text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap">{preview || '—'}</p>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>← Назад</Button>
        <Button onClick={onConfirm} disabled={isLoading || count === 0}>
          {isLoading ? 'Запуск...' : '🚀 Запустить рассылку'}
        </Button>
      </div>
    </div>
  );
}
