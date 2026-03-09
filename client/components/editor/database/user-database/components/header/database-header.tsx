/**
 * @fileoverview Компонент заголовка панели базы данных
 * @description Отображает иконку, название и название проекта
 */

import { Users } from 'lucide-react';

/**
 * Пропсы компонента DatabaseHeader
 */
interface DatabaseHeaderProps {
  /** Название проекта */
  projectName: string;
}

/**
 * Компонент заголовка базы данных
 * @param props - Пропсы компонента
 * @returns JSX компонент заголовка
 */
export function DatabaseHeader({ projectName }: DatabaseHeaderProps): React.JSX.Element {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-purple-500/10 dark:from-blue-500/20 dark:via-cyan-500/10 dark:to-purple-500/20 p-4 sm:p-5 lg:p-6">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon and Title */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground leading-tight tracking-tight">
              База данных пользователей
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-0.5 truncate">
              {projectName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
