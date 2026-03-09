/**
 * @fileoverview Компонент формы ввода сообщения
 * @description Textarea и кнопка отправки сообщения
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Send } from 'lucide-react';

/**
 * Пропсы компонента MessageInputForm
 */
interface MessageInputFormProps {
  /** Текст сообщения */
  messageText: string;
  /** Функция установки текста сообщения */
  setMessageText: (text: string) => void;
  /** Флаг отправки сообщения */
  isPending: boolean;
  /** Функция отправки сообщения */
  onSend: () => void;
}

/**
 * Компонент формы ввода сообщения
 * @param props - Пропсы компонента
 * @returns JSX компонент формы
 */
export function MessageInputForm({
  messageText,
  setMessageText,
  isPending,
  onSend,
}: MessageInputFormProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <Label htmlFor="message-input" className="text-sm font-medium">
        Отправить сообщение
      </Label>
      <div className="flex gap-2">
        <Textarea
          id="message-input"
          data-testid="textarea-message-input"
          placeholder="Введите сообщение..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (messageText.trim() && !isPending) {
                onSend();
              }
            }
          }}
          rows={3}
          disabled={isPending}
          className="flex-1 resize-none"
        />
      </div>
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          Нажмите Enter для отправки, Shift+Enter для новой строки
        </p>
        <Button
          data-testid="button-send-message"
          onClick={onSend}
          disabled={!messageText.trim() || isPending}
          size="sm"
        >
          {isPending ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Отправить
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
