/**
 * @fileoverview Компонент ввода сообщения с поддержкой медиафайлов
 * @module editor/database/dialog/components/dialog-input
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send } from 'lucide-react';
import { usePastedMedia } from '../hooks/use-pasted-media';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { MultiMediaSelector } from '@/components/editor/properties/media/multi-media-selector';
import { FileIdInput } from '@/components/editor/properties/media/file-id-input';
import { DialogButtonsEditor } from './dialog-buttons-editor';
import { DialogAttachmentMenu } from './dialog-attachment-menu';
import type { Button as MessageButton } from '@shared/schema';
import type { NodeWithSheet } from '../utils/node-utils';

/**
 * Свойства компонента ввода сообщения
 */
interface DialogInputProps {
  /** Состояние отправки */
  isPending: boolean;
  /** Подпись действия для сообщения либо рассылки. */
  sendLabel?: string;
  /** Подсказка пустого редактора. */
  placeholder?: string;
  /** Идентификатор проекта для медиаселектора */
  projectId: number;
  /** Узлы проекта для выбора цели действия goto в кнопках */
  availableNodes?: NodeWithSheet[];
  /**
   * Функция отправки сообщения
   * @param text - Текст сообщения
   * @param mediaUrls - Массив URL медиафайлов
   * @param buttons - Массив инлайн-кнопок сообщения
   * @param buttonsPerRow - Кол-во кнопок в ряду (0 = все в один ряд)
   */
  onSend: (text: string, mediaUrls: string[], buttons: MessageButton[], buttonsPerRow: number) => void;
}

/**
 * Компонент ввода и отправки сообщения с поддержкой форматирования и медиафайлов.
 * Скрепка раскрывает меню вложений, file_id и кнопок сообщения.
 * @param props - Свойства компонента
 * @returns JSX элемент поля ввода
 */
export function DialogInput({ isPending, projectId, availableNodes, onSend, sendLabel = "Отправить", placeholder = "Введите сообщение..." }: DialogInputProps) {
  const [messageText, setMessageText] = useState('');
  /** Список URL выбранных медиафайлов */
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  /** Флаг видимости медиаселектора */
  const [showMedia, setShowMedia] = useState(false);
  /** Флаг видимости блока ввода Telegram file_id */
  const [showFileId, setShowFileId] = useState(false);
  /** Тип медиа для file_id */
  const [fileIdMediaType, setFileIdMediaType] = useState<'photo' | 'video' | 'audio' | 'document'>('photo');
  /** Список инлайн-кнопок сообщения */
  const [buttons, setButtons] = useState<MessageButton[]>([]);
  /** Кол-во кнопок в ряду (0 = все в один ряд) */
  const [buttonsPerRow, setButtonsPerRow] = useState(0);
  /** Флаг видимости редактора инлайн-кнопок */
  const [showButtons, setShowButtons] = useState(false);

  /** Вставленные файлы добавляются к текущему сообщению и раскрывают вложения. */
  const { onPasteCapture, isUploading } = usePastedMedia(projectId, (urls) => {
    setMediaUrls((prev) => [...prev, ...urls]);
    setShowMedia(true);
  });

  /** Отправляет подготовленное сообщение и очищает редактор. */
  const handleSend = () => {
    // Разрешаем отправку, если есть текст ИЛИ хотя бы один прикреплённый файл.
    // Кнопки сами по себе отправлять нельзя — они лишь дополнение к тексту/медиа.
    if ((messageText.trim() || mediaUrls.length > 0) && !isPending && !isUploading) {
      onSend(messageText.trim(), mediaUrls, buttons, buttonsPerRow);
      setMessageText('');
      setMediaUrls([]);
      setShowMedia(false);
      setShowFileId(false);
      setButtons([]);
      setButtonsPerRow(0);
      setShowButtons(false);
    }
  };

  return (
    <div className="dialogs-composer space-y-2 p-2" onPasteCapture={onPasteCapture}>
      {/* Панель форматирования использует всю ширину над строкой ввода. */}
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-end gap-2">
        <DialogAttachmentMenu
          activePanel={showMedia ? 'media' : showFileId ? 'fileId' : showButtons ? 'buttons' : null}
          mediaCount={mediaUrls.length}
          buttonsCount={buttons.length}
          disabled={isPending}
          onClosePanel={() => { setShowMedia(false); setShowFileId(false); setShowButtons(false); }}
          onSelectMedia={() => { setShowMedia((v) => !v); setShowFileId(false); setShowButtons(false); }}
          onSelectFileId={() => { setShowFileId((v) => !v); setShowMedia(false); setShowButtons(false); }}
          onSelectButtons={() => { setShowButtons((v) => !v); setShowMedia(false); setShowFileId(false); }}
        />
        <div className="contents [&_[contenteditable=true]]:!min-h-[44px] [&_[contenteditable=true]]:!py-2.5 [&_.pointer-events-none]:!top-2.5">
          <CompactInlineEditor composerLayout value={messageText} onChange={setMessageText} placeholder={placeholder} />
        </div>
        <Button
          type="button"
          data-testid="dialog-panel-button-send"
          aria-label={isPending ? 'Отправка сообщения' : sendLabel}
          aria-busy={isPending}
          title={isPending ? 'Отправка сообщения' : sendLabel}
          onClick={handleSend}
          disabled={(!messageText.trim() && mediaUrls.length === 0) || isPending || isUploading}
          size="sm"
          className="col-start-3 row-start-3 h-[46px] shrink-0 gap-2 px-3"
        >
          {isPending ? <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          <span className="hidden sm:inline">{isPending ? 'Отправка…' : sendLabel}</span>
        </Button>
      </div>

      {isUploading && <p role="status" className="text-xs text-muted-foreground">Загрузка вложений…</p>}
      {/* Медиаселектор расположен под кнопкой прикрепления файла. */}
      {showMedia && (
        <div className="border rounded-md p-2 bg-muted/30 max-h-48 overflow-y-auto">
          <MultiMediaSelector
            projectId={projectId}
            value={mediaUrls}
            onChange={setMediaUrls}
            label=""
          />
        </div>
      )}

      {/* Блок ввода Telegram file_id расположен под рядом инструментов. */}
      {showFileId && (
        <div className="border rounded-md p-3 bg-muted/30 border-border">
          <FileIdInput
            projectId={projectId}
            mediaType={fileIdMediaType}
            onMediaTypeChange={setFileIdMediaType}
            onAdd={(entry) => {
              setMediaUrls((prev) => [...prev, entry]);
              setShowFileId(false);
            }}
          />
        </div>
      )}

      {/* Редактор инлайн-кнопок расположен под рядом инструментов. */}
      {showButtons && (
        <div className="border rounded-md p-3 bg-muted/30 border-border max-h-64 overflow-y-auto">
          <DialogButtonsEditor
            buttons={buttons}
            onChange={setButtons}
            availableNodes={availableNodes}
            buttonsPerRow={buttonsPerRow}
            onButtonsPerRowChange={setButtonsPerRow}
          />
        </div>
      )}
    </div>
  );
}
