import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageSquare,
  RefreshCw,
  Send,
  Bot,
  User,
  X
} from 'lucide-react';
import { UserBotData, BotMessage } from '@shared/schema';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type BotMessageWithMedia = BotMessage & {
  media?: Array<{
    id: number;
    url: string;
    type: string;
    width?: number;
    height?: number;
  }>;
};

interface DialogPanelProps {
  projectId: number;
  user: UserBotData | null;
  onClose: () => void;
}

export function DialogPanel({ projectId, user, onClose }: DialogPanelProps) {
  const [messageText, setMessageText] = useState('');
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch messages for dialog
  const { data: messages = [], isLoading: messagesLoading, refetch: refetchMessages } = useQuery<BotMessageWithMedia[]>({
    queryKey: [`/api/projects/${projectId}/users/${user?.userId}/messages`],
    enabled: !!user?.userId,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Auto-scroll to bottom when messages load or user changes
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

  // Format date for display
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return '';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return format(dateObj, 'PPp', { locale: ru });
    } catch {
      return '';
    }
  };

  // Format user name
  const formatUserName = (userData: UserBotData | null): string => {
    if (!userData) return '';
    const parts = [];
    if (userData.firstName) parts.push(userData.firstName);
    if (userData.lastName) parts.push(userData.lastName);
    if (userData.userName) parts.push(`@${userData.userName}`);
    return parts.length > 0 ? parts.join(' ') : `ID: ${userData.userId}`;
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ messageText }: { messageText: string }) => {
      if (!user) throw new Error('No user selected');
      return apiRequest('POST', `/api/projects/${projectId}/users/${user.userId}/send-message`, {
        messageText
      });
    },
    onSuccess: () => {
      setMessageText('');
      refetchMessages();
      toast({
        title: "Сообщение отправлено",
        description: "Сообщение успешно отправлено пользователю",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    }
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
            {messages.map((message, index) => {
              const isBot = message.messageType === 'bot';
              const isUser = message.messageType === 'user';

              return (
                <div
                  key={message.id || index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  data-testid={`dialog-message-${message.messageType}-${index}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isBot ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                      }`}>
                      {isBot ? (
                        <Bot className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div className="flex flex-col gap-1">
                      {/* Media files */}
                      {message.media && Array.isArray(message.media) && message.media.length > 0 && (
                        <div className="rounded-lg overflow-hidden max-w-[200px] space-y-1">
                          {message.media.map((m: any, idx: number) => (
                            <img
                              key={idx}
                              src={m.url}
                              alt="Photo"
                              className="w-full h-auto rounded-lg"
                              data-testid={`dialog-photo-${message.id}-${idx}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ))}
                        </div>
                      )}

                      <div className={`rounded-lg px-3 py-2 ${isBot
                          ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
                          : 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
                        }`}>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message?.messageText ? String(message.messageText) : ''}
                        </p>
                      </div>

                      {/* Buttons for bot messages */}
                      {isBot && message.messageData && typeof message.messageData === 'object' && 'buttons' in message.messageData && Array.isArray((message.messageData as Record<string, any>).buttons) && ((message.messageData as Record<string, any>).buttons as Array<any>).length > 0 ? (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(Array.isArray((message.messageData as any)?.buttons) ? (message.messageData as any).buttons : []).map((button: any, btnIndex: number) => (
                            <div
                              key={btnIndex}
                              className="inline-flex items-center px-2 py-0.5 text-xs rounded-md border bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                              data-testid={`dialog-button-preview-${index}-${btnIndex}`}
                            >
                              {String(button?.text ?? '')}
                            </div>
                          ))}
                        </div>
                      ) : null}

                      {/* Button clicked info for user messages */}
                      {isUser && message.messageData && typeof message.messageData === 'object' && 'button_clicked' in message.messageData && message.messageData.button_clicked ? (
                        <div className="mt-1">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
                            <span>{'button_text' in message.messageData && message.messageData.button_text
                              ? `Нажата: ${message.messageData.button_text}`
                              : 'Нажата кнопка'}</span>
                          </div>
                        </div>
                      ) : null}

                      {/* Timestamp */}
                      {message.createdAt && (
                        <span className="text-xs text-muted-foreground">{formatDate(message.createdAt)}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
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
