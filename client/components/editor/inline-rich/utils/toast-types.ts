/**
 * @fileoverview Общие типы для уведомлений (toast) в inline-rich редакторе
 */

/** Параметры уведомления */
export interface ToastOptions {
  /** Заголовок уведомления */
  title: string;
  /** Описание уведомления */
  description: string;
  /** Вариант отображения */
  variant?: 'default' | 'destructive';
}

/** Тип функции показа уведомления */
export type ToastFn = (toast: ToastOptions) => void;
