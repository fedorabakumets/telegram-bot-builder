/**
 * @fileoverview Страница первоначальной настройки — точка входа для роута /setup
 * @module pages/setup
 */

import { SetupPage } from '@/components/editor/setup';

/**
 * Страница настройки приложения.
 * Тонкая обёртка над компонентом SetupPage для использования в роутере.
 *
 * @returns JSX элемент страницы настройки
 */
export default function Setup() {
  return <SetupPage />;
}
