/**
 * @fileoverview Шаг 2 wizard: редактор сообщения рассылки
 * @module client/components/editor/broadcast/wizard/step-message
 */

import { useState, useMemo } from 'react';
import { Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { MultiMediaSelector } from '@/components/editor/properties/media/multi-media-selector';
import { FileIdInput } from '@/components/editor/properties/media/file-id-input';
import { DialogButtonsEditor } from '@/components/editor/database/dialog/components/dialog-buttons-editor';
import { useProjectData } from '@/components/editor/database/dialog/hooks/use-project-data';
import { collectNodesFromProjectData } from '@/components/editor/database/dialog/utils/node-utils';
import type { NewBroadcastFormData } from '../types';

/**
 * Пропсы компонента StepMessage
 */
interface StepMessageProps {
  /** Идентификатор проекта */
  projectId: number;
  /** Текущие данные формы */
  formData: NewBroadcastFormData;
  /** Обновление данных формы */
  onChange: (data: Partial<NewBroadcastFormData>) => void;
  /** Переход к следующему шагу */
  onNext: () => void;
  /** Возврат к предыдущему шагу */
  onBack: () => void;
}

/** Доступные переменные для вставки в сообщение */
const VARIABLES = [
  { key: '{first_name}', label: 'Имя' },
  { key: '{last_name}', label: 'Фамилия' },
  { key: '{username}', label: 'Username' },
  { key: '{user_id}', label: 'ID' },
];

/**
 * Шаг редактирования текста и медиа сообщения рассылки
 * @param props - Свойства компонента
 * @returns JSX элемент шага редактора сообщения
 */
export function StepMessage({ projectId, formData, onChange, onNext, onBack }: StepMessageProps) {
  /** Флаг видимости блока ввода Telegram file_id */
  const [showFileId, setShowFileId] = useState(false);
  /** Тип медиа для file_id */
  const [fileIdMediaType, setFileIdMediaType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');

  /** Данные проекта для извлечения узлов (нужны редактору кнопок для действия goto) */
  const { project } = useProjectData(projectId);

  /** Узлы проекта со всех листов для выбора цели действия goto в инлайн-кнопках */
  const availableNodes = useMemo(
    () => collectNodesFromProjectData((project?.data as Record<string, unknown>) ?? null),
    [project?.data],
  );

  /**
   * Вставляет переменную в конец текста сообщения
   * @param variable - Переменная для вставки
   */
  const insertVariable = (variable: string) => {
    onChange({ messageText: formData.messageText + variable });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Текст сообщения</p>
        <CompactInlineEditor
          value={formData.messageText}
          onChange={(val) => onChange({ messageText: val })}
          placeholder="Введите текст рассылки..."
          showStats
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">Вставить переменную:</p>
        <div className="flex flex-wrap gap-1.5">
          {VARIABLES.map(({ key, label }) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => insertVariable(key)}
            >
              {key} <span className="ml-1 text-muted-foreground">({label})</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Прикрепление медиафайлов — переиспользуем MultiMediaSelector из панели свойств */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Медиафайл (необязательно)</p>
        <div className="rounded-xl border border-pink-200/40 dark:border-pink-800/40 bg-gradient-to-br from-pink-50/40 to-rose-50/20 dark:from-pink-950/30 dark:to-rose-900/20 p-3">
          <MultiMediaSelector
            projectId={projectId}
            value={formData.mediaUrls}
            onChange={(urls) => onChange({ mediaUrls: urls })}
            label="Прикреплённые файлы"
            placeholder="Введите URL или выберите файл"
          />

          {/* Кнопка переключения блока ввода Telegram file_id */}
          <Button
            variant={showFileId ? 'secondary' : 'outline'}
            size="sm"
            className="mt-2 h-7 text-xs"
            onClick={() => setShowFileId((v) => !v)}
          >
            <Hash className="w-3.5 h-3.5 mr-1" />
            Добавить Telegram file_id
          </Button>

          {/* Блок ввода Telegram file_id */}
          {showFileId && (
            <div className="mt-2 border rounded-md p-3 bg-violet-50/30 dark:bg-violet-900/10 border-violet-200/60 dark:border-violet-700/60 max-h-64 overflow-y-auto">
              <FileIdInput
                projectId={projectId}
                mediaType={fileIdMediaType}
                onMediaTypeChange={setFileIdMediaType}
                onAdd={(entry) => {
                  onChange({ mediaUrls: [...formData.mediaUrls, entry] });
                  setShowFileId(false);
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Инлайн-кнопки — переиспользуем DialogButtonsEditor из диалога */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Инлайн-кнопки (необязательно)</p>
        <div className="rounded-xl border border-blue-200/40 dark:border-blue-800/40 bg-gradient-to-br from-blue-50/40 to-violet-50/20 dark:from-blue-950/30 dark:to-violet-900/20 p-3">
          <DialogButtonsEditor
            buttons={formData.buttons ?? []}
            onChange={(buttons) => onChange({ buttons })}
            availableNodes={availableNodes}
          />
        </div>
      </div>

      {formData.messageText && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Предпросмотр:</p>
          <div className="rounded-xl rounded-tl-sm bg-gradient-to-br from-blue-50 to-violet-50 dark:from-blue-950/40 dark:to-violet-950/30 border border-blue-100 dark:border-blue-900/40 p-3 text-sm whitespace-pre-wrap break-words max-h-24 overflow-auto">
            {formData.messageText.replace(/<[^>]+>/g, '')}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>← Назад</Button>
        <Button
          onClick={onNext}
          disabled={!formData.messageText.trim()}
          className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600"
        >
          Далее →
        </Button>
      </div>
    </div>
  );
}
