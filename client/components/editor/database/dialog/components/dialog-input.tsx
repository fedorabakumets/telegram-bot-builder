/**
 * @fileoverview Компонент ввода сообщения с поддержкой медиафайлов
 * @module editor/database/dialog/components/dialog-input
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send, Paperclip } from 'lucide-react';
import { CompactInlineEditor } from '@/components/editor/inline-rich/compact-inline-editor';
import { MultiMediaSelector } from '@/components/editor/properties/media/multi-media-selector';

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
 * Содержит кнопку-скрепку для показа/скрытия медиаселектора.
 * @param props - Свойства компонента
 * @returns JSX элемент поля ввода
 */
export function DialogInput({ isPending, projectId, onSend }: DialogInputProps) {
  const [messageText, setMessageText] = useState('');
  /** Список URL выбранных медиафайлов */
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  /** Флаг видимости медиаселектора */
  const [showMedia, setShowMedia] = useState(false);

  const handleSend = () => {
    if (messageText.trim() && !isPending) {
      onSend(messageText.trim(), mediaUrls);
      setMessageText('');
      setMediaUrls([]);
      setShowMedia(false);
    }
  };

  return (
    <div className="p-3 space-y-2">
      <CompactInlineEditor
        value={messageText}
        onChange={setMessageText}
        placeholder="Введите сообщение..."
      />

      {/* Медиаселектор — показывается при нажатии на скрепку */}
      {showMedia && (
        <div className="border rounded-md p-2 bg-muted/30">
          <MultiMediaSelector
            projectId={projectId}
            value={mediaUrls}
            onChange={setMediaUrls}
            label=""
          />
        </div>
      )}

      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">Enter - отправить</p>
        <div className="flex items-center gap-1">
          {/* Кнопка прикрепления медиафайлов */}
          <Button
            variant={showMedia ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowMedia((v) => !v)}
            title="Прикрепить медиафайл"
          >
            <Paperclip className="w-4 h-4" />
            {mediaUrls.length > 0 && (
              <span className="ml-1 text-xs font-semibold">{mediaUrls.length}</span>
            )}
          </Button>

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
    </div>
  );
}
