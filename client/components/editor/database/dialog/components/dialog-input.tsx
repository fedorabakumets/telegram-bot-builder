/**
 * @fileoverview Компонент ввода сообщения
 * Поле ввода и кнопка отправки
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Send } from 'lucide-react';

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
 * Компонент ввода и отправки сообщения
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
      <div className="flex gap-2">
        <Textarea
          data-testid="dialog-panel-textarea-message"
          placeholder="Введите сообщение..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          rows={2}
          disabled={isPending}
          className="flex-1 resize-none text-sm"
        />
      </div>
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
