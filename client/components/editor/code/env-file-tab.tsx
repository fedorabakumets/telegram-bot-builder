/**
 * @fileoverview Компонент вкладки .env файла
 *
 * Этот модуль предоставляет компонент для отображения вкладки
 * с файлом переменных окружения (.env) в панели кода.
 *
 * @module EnvFileTab
 */

import { TabsTrigger } from '@/components/ui/tabs';

/**
 * Компонент вкладки .env файла для панели кода
 * @returns JSX элемент вкладки
 */
export function EnvFileTab() {
  return (
    <TabsTrigger
      value="env"
      className="w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm font-normal rounded-none border-b border-border/50 data-[state=inactive]:hover:bg-accent/20 justify-start min-w-0"
    >
      <i className="fas fa-lock text-red-500 text-xs flex-shrink-0"></i>
      <span className="text-xs truncate min-w-0">.env</span>
    </TabsTrigger>
  );
}
