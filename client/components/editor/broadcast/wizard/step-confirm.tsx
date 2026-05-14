/**
 * @fileoverview Шаг 3 wizard: подтверждение перед запуском рассылки
 * @module client/components/editor/broadcast/wizard/step-confirm
 */

import { Tag, Users, Clock, MessageSquare, Rocket, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudiencePreview } from '../hooks/use-audience-preview';
import { MediaPreviewList } from '../components/media-preview';
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
      <p className="text-sm font-medium text-muted-foreground">Проверьте параметры рассылки</p>

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
            {isCountLoading ? '...' : count.toLocaleString('ru-RU')}
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
            <span className="text-muted-foreground">Текст сообщения</span>
          </div>
          {/* Пузырь предпросмотра как сообщение бота */}
          <div className="ml-6 relative rounded-xl rounded-tl-sm bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/40 dark:to-violet-950/30 border border-blue-100 dark:border-blue-900/40 p-3 text-xs whitespace-pre-wrap break-words max-h-24 overflow-auto">
            {preview || '—'}
          </div>
        </div>
        <MediaPreviewList mediaUrls={formData.mediaUrls ?? []} />
      </div>

      {/* Кнопки навигации */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onBack} disabled={isLoading}>← Назад</Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading || count === 0}
          className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600 gap-1.5 px-5"
        >
          <Rocket className="w-4 h-4" />
          {isLoading ? 'Запуск...' : 'Запустить рассылку'}
        </Button>
      </div>
    </div>
  );
}
