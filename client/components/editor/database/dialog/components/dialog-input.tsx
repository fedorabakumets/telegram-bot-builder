/**
 * @fileoverview Компонент ввода сообщения с поддержкой медиафайлов
 * @module editor/database/dialog/components/dialog-input
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send, Paperclip, Hash, Rows3 } from 'lucide-react';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { MultiMediaSelector } from '@/components/editor/properties/media/multi-media-selector';
import { FileIdInput } from '@/components/editor/properties/media/file-id-input';
import { DialogButtonsEditor } from './dialog-buttons-editor';
import type { Button as MessageButton } from '@shared/schema';

/**
 * Свойства компонента ввода сообщения
 */
interface DialogInputProps {
  /** Состояние отправки */
  isPending: boolean;
  /** Идентификатор проекта для медиаселектора */
  projectId: number;
  /**
   * Функция отправки сообщения
   * @param text - Текст сообщения
   * @param mediaUrls - Массив URL медиафайлов
   * @param buttons - Массив инлайн-кнопок сообщения
   */
  onSend: (text: string, mediaUrls: string[], buttons: MessageButton[]) => void;
}

/**
 * Компонент ввода и отправки сообщения с поддержкой форматирования и медиафайлов.
 * Содержит кнопку-скрепку для медиаселектора и кнопку Telegram file_id.
 * @param props - Свойства компонента
 * @returns JSX элемент поля ввода
 */
export function DialogInput({ isPending, projectId, onSend }: DialogInputProps) {
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
  /** Флаг видимости редактора инлайн-кнопок */
  const [showButtons, setShowButtons] = useState(false);

  const handleSend = () => {
    // Разрешаем отправку, если есть текст ИЛИ хотя бы один прикреплённый файл.
    // Кнопки сами по себе отправлять нельзя — они лишь дополнение к тексту/медиа.
    if ((messageText.trim() || mediaUrls.length > 0) && !isPending) {
      onSend(messageText.trim(), mediaUrls, buttons);
      setMessageText('');
      setMediaUrls([]);
      setShowMedia(false);
      setShowFileId(false);
      setButtons([]);
      setShowButtons(false);
    }
  };

  return (
    <div className="p-3 space-y-2">
      <CompactInlineEditor
        value={messageText}
        onChange={setMessageText}
        placeholder="Введите сообщение..."
      />

      {/* Медиаселектор — показывается при нажатии на скрепку, ограничен по высоте */}
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

      {/* Блок ввода Telegram file_id */}
      {showFileId && (
        <div className="border rounded-md p-3 bg-violet-50/30 dark:bg-violet-900/10 border-violet-200/60 dark:border-violet-700/60 max-h-64 overflow-y-auto">
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

      {/* Блок редактора инлайн-кнопок */}
      {showButtons && (
        <div className="border rounded-md p-3 bg-violet-50/30 dark:bg-violet-900/10 border-violet-200/60 dark:border-violet-700/60 max-h-64 overflow-y-auto">
          <DialogButtonsEditor buttons={buttons} onChange={setButtons} />
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          {/* Кнопка прикрепления медиафайлов */}
          <Button
            variant={showMedia ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setShowMedia((v) => !v); setShowFileId(false); setShowButtons(false); }}
            title="Прикрепить медиафайл"
          >
            <Paperclip className="w-4 h-4" />
            {mediaUrls.length > 0 && (
              <span className="ml-1 text-xs font-semibold">{mediaUrls.length}</span>
            )}
          </Button>

          {/* Кнопка Telegram file_id */}
          <Button
            variant={showFileId ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setShowFileId((v) => !v); setShowMedia(false); setShowButtons(false); }}
            title="Добавить Telegram file_id"
            className={showFileId ? '' : 'text-violet-500 hover:text-violet-600'}
          >
            <Hash className="w-4 h-4" />
          </Button>

          {/* Кнопка редактора инлайн-кнопок */}
          <Button
            variant={showButtons ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setShowButtons((v) => !v); setShowMedia(false); setShowFileId(false); }}
            title="Инлайн-кнопки сообщения"
          >
            <Rows3 className="w-4 h-4" />
            {buttons.length > 0 && (
              <span className="ml-1 text-xs font-semibold">{buttons.length}</span>
            )}
          </Button>

          <p className="text-xs text-muted-foreground ml-1 hidden">Enter - отправить</p>
        </div>

        <Button
          data-testid="dialog-panel-button-send"
          onClick={handleSend}
          disabled={(!messageText.trim() && mediaUrls.length === 0) || isPending}
          size="sm"
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 mr-1" />
              Отправить
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
