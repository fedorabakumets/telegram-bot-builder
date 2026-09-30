/**
 * @fileoverview Кнопка чата поддержки в шапке со счётчиком и выезжающей панелью
 * @module components/support/support-chat-button
 */

import { useEffect, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { SupportComposer } from './support-composer';
import { SupportMessageList } from './support-message-list';
import { SUPPORT_THREAD_QUERY_KEY, useMarkSupportRead, useSendSupportMessage, useSupportThread } from './hooks/use-support-chat';
import { useSupportSocket } from './hooks/use-support-socket';

/**
 * Кнопка «Чат поддержки»: показывает непрочитанные ответы и открывает переписку.
 * Рендерить только для пользователей, вошедших через Telegram.
 * @returns JSX элемент кнопки с панелью
 */
export function SupportChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const socketConnected = useSupportSocket('/api/support/ws', SUPPORT_THREAD_QUERY_KEY);
  const { data, isLoading, error } = useSupportThread(true, socketConnected);
  const sendMessage = useSendSupportMessage();
  const unread = data?.thread?.unreadByUser ?? 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('support') !== '1') return;
    setIsOpen(true);
    params.delete('support');
    const next = params.toString();
    const path = next ? `${window.location.pathname}?${next}` : window.location.pathname;
    window.history.replaceState(null, '', path);
  }, []);

  useMarkSupportRead(isOpen, unread);

  /**
   * Отправляет сообщение и показывает ошибку во всплывающем уведомлении
   * @param payload - Текст и картинки
   * @returns Промис отправки
   */
  const handleSend = (payload: { text: string; files: File[] }) =>
    sendMessage.mutateAsync(payload).catch((err: Error) => {
      toast({ title: 'Не удалось отправить', description: err.message, variant: 'destructive' });
      throw err;
    });

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className="relative h-7 w-7 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        title="Чат поддержки"
        data-testid="button-support-chat"
      >
        <MessageCircle className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b px-4 py-3 text-left">
            <SheetTitle>Поддержка BotCraft</SheetTitle>
            <SheetDescription>
              Ответ придёт сюда и в Telegram.
              {data?.telegramBot && (
                <>
                  {" "}
                  <a
                    href={`https://t.me/${data.telegramBot}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline"
                  >
                    Открыть бота и нажать Start
                  </a>
                </>
              )}
            </SheetDescription>
          </SheetHeader>

          {isLoading && (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          {error && !data && (
            <div className="flex flex-1 items-center justify-center text-sm text-destructive">
              Не удалось загрузить чат.
            </div>
          )}
          {data && (
            <SupportMessageList
              messages={data.messages}
              viewer="user"
              ownRead={(data.thread?.unreadByAdmin ?? 0) === 0}
              emptyText="Здесь пока пусто. Напишите, что случилось, — к сообщению автоматически приложится, в каком проекте вы работаете."
              attachmentBase="/api/support/attachments"
            />
          )}

          <SupportComposer
            onSend={handleSend}
            isSending={sendMessage.isPending}
            placeholder="Ваше сообщение…"
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
