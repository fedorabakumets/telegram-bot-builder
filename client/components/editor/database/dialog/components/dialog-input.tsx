/**
 * @fileoverview Компонент ввода сообщения
 * Поле ввода с форматированием и кнопка отправки
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Send } from 'lucide-react';
import { InlineRichEditor } from '@/components/editor/properties/inline-rich-editor';

/**
 * Свойства компонента ввода
 */
interface DialogInputProps {
  /** Состояние отправки */
  isPending: boolean;
  /** Функция отправки сообщения */
  onSend: (text: string) => void;
}

/**
 * Компонент ввода и отправки сообщения с поддержкой форматирования
 */
export function DialogInput({ isPending, onSend }: DialogInputProps) {
  const [messageText, setMessageText] = useState('');

  const handleSend = () => {
    if (messageText.trim() && !isPending) {
      onSend(messageText.trim());
      setMessageText('');
    }
  };

  return (
    <div className="p-3 space-y-2">
      <InlineRichEditor
        value={messageText}
        onChange={setMessageText}
        placeholder="Введите сообщение..."
        enableMarkdown={false}
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Enter - отправить
        </p>
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
