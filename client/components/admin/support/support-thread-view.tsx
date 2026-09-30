/**
 * @fileoverview Окно переписки с пользователем в панели управления
 * @module components/admin/support/support-thread-view
 */

import { useEffect } from 'react';
import { Link } from 'wouter';
import { CheckCircle2, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { SupportComposer } from '@/components/support/support-composer';
import { SupportMessageList } from '@/components/support/support-message-list';
import { useAdminSupportActions, useAdminSupportThread } from '../hooks/use-admin-support';
import { PlatformUserAvatar, formatPlatformUserName } from '../users/platform-user-avatar';

/** Пропсы окна переписки */
interface SupportThreadViewProps {
  /** Идентификатор открытого диалога */
  threadId: number;
}

/**
 * Переписка: шапка с автором и статусом, лента сообщений, поле ответа.
 * При открытии и новых сообщениях отмечает диалог прочитанным.
 * @param props - Свойства компонента
 * @returns JSX элемент окна переписки
 */
export function SupportThreadView({ threadId }: SupportThreadViewProps) {
  const { toast } = useToast();
  const { data, isLoading, error } = useAdminSupportThread(threadId);
  const { reply, markRead, setStatus } = useAdminSupportActions(threadId);
  const unread = data?.thread.unreadByAdmin ?? 0;

  useEffect(() => {
    if (unread > 0 && !markRead.isPending) markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, unread]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return <p className="p-4 text-sm text-destructive">Диалог не найден или недоступен.</p>;
  }

  const { user, thread, messages } = data;
  const name = formatPlatformUserName(user.firstName, user.lastName, user.username, user.id);
  const isClosed = thread.status === 'closed';

  /**
   * Отправляет ответ и показывает ошибку во всплывающем уведомлении
   * @param text - Текст ответа
   * @returns Промис отправки
   */
  const handleReply = (payload: { text: string; files: File[] }) =>
    reply.mutateAsync(payload).catch((err: Error) => {
      toast({ title: 'Ответ не отправлен', description: err.message, variant: 'destructive' });
      throw err;
    });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <PlatformUserAvatar photoUrl={user.photoUrl} name={name} userId={user.id} size="md" />
        <div className="min-w-0 flex-1">
          <Link href={`/admin/users/${user.id}`} className="block truncate font-medium hover:underline">
            {name}
          </Link>
          <p className="text-xs text-muted-foreground">
            {isClosed ? 'Закрыт' : 'Открыт'} · ID {user.id}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={setStatus.isPending}
          onClick={() => setStatus.mutate(isClosed ? 'open' : 'closed')}
        >
          {isClosed ? <RotateCcw className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
          {isClosed ? 'Открыть снова' : 'Закрыть'}
        </Button>
      </div>

      <SupportMessageList
        messages={messages}
        viewer="admin"
        emptyText="Сообщений нет."
        showContext
        ownRead={thread.unreadByUser === 0}
        attachmentBase="/admin/api/support/attachments"
      />

      <SupportComposer onSend={handleReply} isSending={reply.isPending} placeholder="Ответ пользователю…" />
      <p className="px-3 pb-3 text-[11px] text-muted-foreground">
        Ответ также уйдёт пользователю в Telegram. Его сообщения приходят вам в Telegram.
      </p>
    </div>
  );
}
