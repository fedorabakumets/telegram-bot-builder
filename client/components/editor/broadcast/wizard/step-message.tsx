/**
 * @fileoverview Шаг 2 wizard: редактор сообщения рассылки
 * @module client/components/editor/broadcast/wizard/step-message
 */

import { useState, useMemo } from 'react';
import { ChevronDown, FileKey2, ImagePlus, MousePointerClick } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { MultiMediaSelector } from '@/components/editor/properties/media/multi-media-selector';
import { FileIdInput } from '@/components/editor/properties/media/file-id-input';
import { DialogButtonsEditor } from '@/components/editor/database/dialog/components/dialog-buttons-editor';
import { useProjectData } from '@/components/editor/database/dialog/hooks/use-project-data';
import { collectNodesFromProjectData } from '@/components/editor/database/dialog/utils/node-utils';
import { BroadcastMessagePreview } from '../components/broadcast-message-preview';
import { BroadcastValidationAlerts } from '../components/broadcast-validation-alerts';
import { validateBroadcastMessage } from '../utils/validate-broadcast-message';
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

/**
 * Шаг редактирования текста и медиа сообщения рассылки
 * @param props - Свойства компонента
 * @returns JSX элемент шага редактора сообщения
 */
export function StepMessage({ projectId, formData, onChange, onNext, onBack }: StepMessageProps) {
  /** Флаг видимости блока ввода Telegram file_id */
  const [showFileId, setShowFileId] = useState(false);
  /** Раскрытые разделы сохраняют видимость добавленного содержимого. */
  const [showMedia, setShowMedia] = useState(formData.mediaUrls.length > 0);
  /** Видимость редактора инлайн-кнопок. */
  const [showButtons, setShowButtons] = useState((formData.buttons?.length ?? 0) > 0);
  /** Тип медиа для file_id */
  const [fileIdMediaType, setFileIdMediaType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');

  /** Данные проекта для извлечения узлов (нужны редактору кнопок для действия goto) */
  const { project } = useProjectData(projectId);

  /** Узлы проекта со всех листов для выбора цели действия goto в инлайн-кнопках */
  const availableNodes = useMemo(
    () => collectNodesFromProjectData((project?.data as Record<string, unknown>) ?? null),
    [project?.data],
  );

  /** Валидация по лимитам Telegram */
  const validation = useMemo(() => validateBroadcastMessage(formData), [formData]);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm font-medium">Текст сообщения</p>
        <CompactInlineEditor
          value={formData.messageText}
          onChange={(val) => onChange({ messageText: val })}
          placeholder="Введите текст рассылки..."
        />
        <BroadcastValidationAlerts validation={validation} showTextCounter showMessages={false} />
      </div>

      {/* Прикрепление медиафайлов — переиспользуем MultiMediaSelector из панели свойств */}
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <button type="button" onClick={() => setShowMedia((v) => !v)} aria-expanded={showMedia} aria-controls="broadcast-media-section"
          className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
          <ImagePlus className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 font-medium">Медиафайлы <span className="font-normal text-muted-foreground">{formData.mediaUrls.length ? `· ${formData.mediaUrls.length}` : '· необязательно'}</span></span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showMedia ? 'rotate-180' : ''}`} />
        </button>
        <div id="broadcast-media-section" hidden={!showMedia} className="border-t border-border p-3">
          <MultiMediaSelector
            projectId={projectId}
            value={formData.mediaUrls}
            onChange={(urls) => onChange({ mediaUrls: urls })}
            label=""
            nodeName="Сообщение рассылки"
            placeholder="Перетащи файл или вставь ссылку"
          />

          {/* Кнопка переключения блока ввода Telegram file_id */}
          <Button
            variant={showFileId ? 'secondary' : 'outline'}
            size="sm"
            className="mt-2 h-7 text-xs"
            aria-expanded={showFileId}
            onClick={() => setShowFileId((v) => !v)}
          >
            <FileKey2 className="w-3.5 h-3.5 mr-1" />
            Добавить Telegram file_id
          </Button>

          {/* Блок ввода Telegram file_id */}
          {showFileId && (
            <div className="mt-2 border rounded-md p-3 bg-background border-border max-h-64 overflow-y-auto">
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
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <button type="button" onClick={() => setShowButtons((v) => !v)} aria-expanded={showButtons} aria-controls="broadcast-buttons-section"
          className="flex w-full items-center gap-3 px-3 py-3 text-left text-sm transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
          <MousePointerClick className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 font-medium">Кнопки сообщения <span className="font-normal text-muted-foreground">{formData.buttons?.length ? `· ${formData.buttons.length}` : '· необязательно'}</span></span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${showButtons ? 'rotate-180' : ''}`} />
        </button>
        <div id="broadcast-buttons-section" hidden={!showButtons} className="border-t border-border p-3">
          <DialogButtonsEditor
            buttons={formData.buttons ?? []}
            onChange={(buttons) => onChange({ buttons })}
            availableNodes={availableNodes}
            buttonsPerRow={formData.buttonsPerRow ?? 0}
            onButtonsPerRowChange={(v) => onChange({ buttonsPerRow: v })}
          />
        </div>
      </div>

      <BroadcastMessagePreview
        messageText={formData.messageText}
        mediaUrls={formData.mediaUrls}
        buttons={formData.buttons}
        buttonsPerRow={formData.buttonsPerRow}
        projectId={projectId}
      />

      <BroadcastValidationAlerts validation={validation} />

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onBack}>← Назад</Button>
        <Button
          onClick={onNext}
          disabled={!validation.isValid}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Далее →
        </Button>
      </div>
    </div>
  );
}
