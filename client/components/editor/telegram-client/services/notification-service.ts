/**
 * @fileoverview Сервис уведомлений
 *
 * Абстракция над toast для упрощения тестирования.
 *
 * @module NotificationService
 */

/** Опции уведомления */
export interface NotificationOptions {
  title: string;
  description?: string;
}

/** Сервис уведомлений */
export interface NotificationService {
  success(title: string, description?: string): void;
  error(title: string, description?: string): void;
  info(title: string, description?: string): void;
}

/** Создать сервис уведомлений */
export function createNotificationService(
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void
): NotificationService {
  return {
    success: (title, description) => {
      toast({ title, description, variant: 'default' });
    },
    error: (title, description) => {
      toast({ title, description, variant: 'destructive' });
    },
    info: (title, description) => {
      toast({ title, description, variant: 'default' });
    },
  };
}
