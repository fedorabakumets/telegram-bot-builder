/**
 * @fileoverview Компонент ввода сообщения с поддержкой медиафайлов
 * @module editor/database/dialog/components/dialog-input
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send, Paperclip, Hash } from 'lucide-react';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { MultiMediaSelector } from '@/components/editor/properties/media/multi-media-selector';
import { FileIdInput } from '@/components/editor/properties/media/file-id-input';

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
   */
  onSend: (text: string, mediaUrls: string[]) => void;
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

  const handleSend = () => {
    if (messageText.trim() && !isPending) {
      onSend(messageText.trim(), mediaUrls);
      setMessageText('');
      setMediaUrls([]);
      setShowMedia(false);
      setShowFileId(false);
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

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          {/* Кнопка прикрепления медиафайлов */}
          <Button
            variant={showMedia ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setShowMedia((v) => !v); setShowFileId(false); }}
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
            onClick={() => { setShowFileId((v) => !v); setShowMedia(false); }}
            title="Добавить Telegram file_id"
            className={showFileId ? '' : 'text-violet-500 hover:text-violet-600'}
          >
            <Hash className="w-4 h-4" />
          </Button>

          <p className="text-xs text-muted-foreground ml-1 hidden">Enter - отправить</p>
        </div>

        <Button
          data-testid="dialog-panel-button-send"
          onClick={handleSend}
          disabled={!messageText.trim() || isPending}
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
