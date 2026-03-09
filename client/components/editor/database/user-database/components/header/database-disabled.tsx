/**
 * @fileoverview Компонент состояния "База данных выключена"
 * @description Отображается когда база данных пользователей отключена
 */

import { Card } from '@/components/ui/card';
import { Database } from 'lucide-react';

/**
 * Компонент состояния отключенной БД
 * @returns JSX компонент
 */
export function DatabaseDisabled(): React.JSX.Element {
  return (
    <Card className="max-w-md w-full border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50">
      <div className="p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-4">
            <Database className="w-12 h-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
            База данных выключена
          </h3>
          <p className="text-red-700 dark:text-red-300 text-sm">
            Включите базу данных с помощью переключателя выше, чтобы начать сохранять данные пользователей и просматривать статистику.
          </p>
        </div>
        <div className="pt-2">
          <p className="text-xs text-red-600/80 dark:text-red-400/80">
            Пока база данных выключена, бот продолжает работать, но данные пользователей не сохраняются.
          </p>
        </div>
      </div>
    </Card>
  );
}
