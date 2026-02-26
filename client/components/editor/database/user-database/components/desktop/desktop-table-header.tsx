/**
 * @fileoverview Компонент заголовка таблицы пользователей
 * @description Отображает заголовки колонок таблицы
 */

import { TableHead, TableHeader, TableRow } from '@/components/ui/table';

/**
 * Компонент заголовка таблицы пользователей
 * @returns JSX компонент заголовка таблицы
 */
export function DesktopTableHeader(): React.JSX.Element {
  return (
    <TableHeader className="bg-muted/40 hover:bg-muted/50">
      <TableRow className="border-b border-border/50 hover:bg-transparent">
        <TableHead className="font-semibold h-10">Пользователь</TableHead>
        <TableHead className="font-semibold h-10">Статус</TableHead>
        <TableHead className="text-center font-semibold h-10">Сообщения</TableHead>
        <TableHead className="font-semibold h-10">Ответы</TableHead>
        <TableHead className="text-sm font-semibold h-10">Активность</TableHead>
        <TableHead className="text-sm font-semibold h-10">Регистрация</TableHead>
        <TableHead className="text-right font-semibold h-10">Действия</TableHead>
      </TableRow>
    </TableHeader>
  );
}
