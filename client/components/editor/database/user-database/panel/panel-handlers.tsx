/**
 * @fileoverview Обработчики событий компонента UserDatabasePanel
 * @description Функции для управления пользователями и сообщениями
 */

import { UserBotData } from '@shared/schema';

/**
 * Пропсы для хука useUserDatabasePanelHandlers
 */
interface UseUserDatabasePanelHandlersParams {
  /** Мутация обновления пользователя */
  updateUserMutation: any;
  /** Функция для уведомлений */
  toast: any;
  /** Ref для прокрутки */
  messagesScrollRef: React.RefObject<HTMLDivElement>;
}

/**
 * Результат хука useUserDatabasePanelHandlers
 */
interface UseUserDatabasePanelHandlersReturn {
  /** Переключение статуса пользователя */
  handleUserStatusToggle: (
    user: UserBotData,
    field: 'isActive' | 'isBlocked' | 'isPremium'
  ) => void;
  /** Прокрутка вниз */
  scrollToBottom: () => void;
  /** Поиск URL фото по file_id */
  getPhotoUrlFromMessages: (fileId: string) => string | null;
}

/**
 * Хук для создания обработчиков событий
 * @param params - Параметры хука
 * @returns Объект с обработчиками
 */
export function useUserDatabasePanelHandlers(
  params: UseUserDatabasePanelHandlersParams,
  userDetailsMessages: any[]
): UseUserDatabasePanelHandlersReturn {
  const { updateUserMutation, toast, messagesScrollRef } = params;

  /**
   * Переключение статуса пользователя
   */
  const handleUserStatusToggle = (
    user: UserBotData,
    field: 'isActive' | 'isBlocked' | 'isPremium'
  ) => {
    const currentValue = user[field];
    const newValue = currentValue === 1 ? 0 : 1;
    const userId = user.id;

    if (!userId) {
      console.error('User ID not found');
      return;
    }

    if (field === 'isActive') {
      updateUserMutation.mutate({
        userId: userId,
        data: { [field]: newValue },
      });
    } else {
      toast({
        title: 'Функция недоступна',
        description: `Изменение статуса "${field}" пока не поддерживается`,
        variant: 'destructive',
      });
    }
  };

  /**
   * Прокрутка вниз
   */
  const scrollToBottom = () => {
    const scrollArea = messagesScrollRef.current;
    if (!scrollArea) return;
    
    setTimeout(() => {
      const scrollElement = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }, 100);
  };

  /**
   * Поиск URL фото по file_id
   */
  const getPhotoUrlFromMessages = (fileId: string): string | null => {
    if (!fileId || !userDetailsMessages.length) return null;

    for (const msg of userDetailsMessages) {
      if (msg.media && Array.isArray(msg.media)) {
        for (const m of msg.media) {
          if (m.url) return m.url;
        }
      }
      const msgData = msg.messageData as Record<string, any> | null;
      if (msgData?.photo?.file_id === fileId && msg.media?.[0]?.url) {
        return msg.media[0].url;
      }
      if (msgData?.is_photo_answer && msg.media?.[0]?.url) {
        return msg.media[0].url;
      }
    }

    const photoMessages = userDetailsMessages.filter(
      (m) => m.messageType === 'user' && m.media && m.media.length > 0
    );
    if (photoMessages.length > 0) {
      return photoMessages[photoMessages.length - 1].media![0].url;
    }

    return null;
  };

  return {
    handleUserStatusToggle,
    scrollToBottom,
    getPhotoUrlFromMessages,
  };
}
