import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  RefreshCw,
  Send,
  X
} from 'lucide-react';
import { DialogPanelProps, BotMessageWithMedia } from './types';
import { formatUserName } from './utils/format-user-name';
import { useSendMessage } from './hooks/use-send-message';
import { MessageBubble } from './components/message-bubble';

/**
 * Компонент панели диалога с пользователем бота
 * Отображает историю сообщений и позволяет отправлять новые сообщения пользователю
 * @param projectId - Идентификатор проекта
 * @param user - Данные пользователя для диалога
 * @param onClose - Функция закрытия панели
 * @returns JSX элемент панели диалога
 */
export function DialogPanel({ projectId, user, onClose }: DialogPanelProps) {
  // Состояние текста нового сообщения
  const [messageText, setMessageText] = useState('');
  // Ссылка на контейнер сообщений для автопрокрутки
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  /**
   * Загрузка сообщений диалога с пользователем
   * Автоматически обновляется при изменении пользователя
   */
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${user?.userId}/messages`],
    enabled: !!user?.userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  /**
   * Автоматическая прокрутка к последнему сообщению
   * Срабатывает при загрузке сообщений или смене пользователя
   */
  useEffect(() => {
    if (!messagesLoading && messages.length > 0 && messagesScrollRef.current) {
      setTimeout(() => {
        const scrollElement = messagesScrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }, 100);
    }
  }, [messagesLoading, messages.length, user?.userId]);

  /** Мутация отправки сообщения */
  const sendMessageMutation = useSendMessage(projectId, user?.userId ? Number(user.userId) : undefined, () => {
    setMessageText('');
    refetchMessages();
  });

  if (!user) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4">
        <MessageSquare className="w-12 h-12 mb-4" />
        <p className="text-center">Выберите пользователя для просмотра диалога</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <MessageSquare className="w-5 h-5 flex-shrink-0 text-primary" />
          <div className="min-w-0">
            <h3 className="font-medium text-sm truncate">Диалог</h3>
            <p className="text-xs text-muted-foreground truncate">{formatUserName(user)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          data-testid="button-close-dialog-panel"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Предупреждение о фиксации сообщений */}
      <div className="flex items-start gap-2 p-3 bg-amber-50/50 dark:bg-amber-950/30 border-b border-amber-200/50 dark:border-amber-800/40">
        <i className="fas fa-exclamation-triangle text-amber-600 dark:text-amber-400 text-sm mt-0.5 flex-shrink-0"></i>
        <div>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed font-medium">
            Некоторые сообщения могут не фиксироваться
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 leading-relaxed">
            Проверьте с помощью консоли логов для полной истории
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={messagesScrollRef} className="flex-1 p-3" data-testid="dialog-messages-scroll-area">
        {messagesLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground text-sm">Загрузка...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="empty-dialog-messages">
            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-sm">Нет сообщений</p>
            <p className="text-xs text-muted-foreground mt-1">
              Начните диалог, отправив первое сообщение
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {messages.map((message, index) => (
              <MessageBubble key={message.id || index} message={message} index={index} />
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Message Input */}
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
                if (messageText.trim() && !sendMessageMutation.isPending) {
                  sendMessageMutation.mutate({ messageText: messageText.trim() });
                }
              }
            }}
            rows={2}
            disabled={sendMessageMutation.isPending}
            className="flex-1 resize-none text-sm"
          />
        </div>
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Enter - отправить
          </p>
          <Button
            data-testid="dialog-panel-button-send"
            onClick={() => {
              if (messageText.trim() && !sendMessageMutation.isPending) {
                sendMessageMutation.mutate({ messageText: messageText.trim() });
              }
            }}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            size="sm"
          >
            {sendMessageMutation.isPending ? (
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
