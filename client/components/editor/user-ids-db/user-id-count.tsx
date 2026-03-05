/**
 * @fileoverview Лаконичный счётчик количества ID в базе
 * Отображает общее количество записей компактно
 */

import { Users } from 'lucide-react';

/**
 * Свойства счётчика ID
 */
interface UserIdCountProps {
  /** Общее количество ID */
  count: number;
}

/**
 * Компонент лаконичного отображения количества ID
 */
export function UserIdCount({ count }: UserIdCountProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium">
      <Users className="w-4 h-4" />
      <span>{count}</span>
      <span className="text-xs opacity-70">ID</span>
    </div>
  );
}
