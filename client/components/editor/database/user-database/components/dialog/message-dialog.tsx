/**
 * @fileoverview Компонент диалога отправки сообщений
 * @description Главный компонент диалога, объединяющий все подкомпоненты
 */

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/components/editor/header/hooks/use-mobile';
import { UserBotData } from '@shared/schema';
import { BotMessageWithMedia } from '../../types';
import { MessageDialogHeader } from './dialog-header';
import { MessagesArea } from './messages-area';
import { MessageInputForm } from './message-input-form';

/**
 * Пропсы компонента MessageDialog
 */
interface MessageDialogProps {
  /** Флаг открытия диалога */
  open: boolean;
  /** Функция закрытия диалога */
  onOpenChange: (open: boolean) => void;
  /** Выбранный пользователь */
  selectedUser: UserBotData | null;
  /** Функция форматирования имени */
  formatUserName: (user: UserBotData) => string;
  /** Ссылка на элемент прокрутки */
  messagesScrollRef: React.RefObject<HTMLDivElement>;
  /** Флаг загрузки сообщений */
  isMessagesLoading: boolean;
  /** Список сообщений */
  messages: BotMessageWithMedia[];
  /** Текст сообщения */
  messageText: string;
  /** Функция установки текста */
  setMessageText: (text: string) => void;
  /** Флаг отправки */
  isSending: boolean;
  /** Функция отправки */
  sendMessage: (text: string) => void;
}

/**
 * Компонент диалога отправки сообщений
 * @param props - Пропсы компонента
 * @returns JSX компонент диалога
 */
export function MessageDialog(props: MessageDialogProps): React.JSX.Element {
  const {
    open,
    onOpenChange,
    selectedUser,
    formatUserName,
    messagesScrollRef,
    isMessagesLoading,
    messages,
    messageText,
    setMessageText,
    isSending,
    sendMessage,
  } = props;

  const isMobile = useIsMobile();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-2xl max-h-[80vh]'} flex flex-col`}
      >
        <MessageDialogHeader selectedUser={selectedUser} formatUserName={formatUserName} />

        <div className="flex-1 flex flex-col min-h-0">
          <MessagesArea
            messagesScrollRef={messagesScrollRef}
            isLoading={isMessagesLoading}
            messages={messages}
          />

          <Separator className="my-4" />

          <MessageInputForm
            messageText={messageText}
            setMessageText={setMessageText}
            isPending={isSending}
            onSend={() => {
              if (messageText.trim() && !isSending) {
                sendMessage(messageText.trim());
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
