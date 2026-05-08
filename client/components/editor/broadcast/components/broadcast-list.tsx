/**
 * @fileoverview Таблица списка рассылок
 * @module client/components/editor/broadcast/components/broadcast-list
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BroadcastStatusBadge } from './broadcast-status-badge';
import type { Broadcast } from '../types';

/**
 * Пропсы компонента BroadcastList
 */
interface BroadcastListProps {
  /** Список рассылок */
  broadcasts: Broadcast[];
  /** Обработчик выбора рассылки */
  onSelect: (broadcast: Broadcast) => void;
  /** Идентификатор выбранной рассылки */
  selectedId?: number | null;
}

/**
 * Таблица рассылок с кликабельными строками.
 * Показывает пустое состояние если рассылок нет.
 *
 * @param props - Свойства компонента
 * @returns JSX элемент таблицы рассылок
 */
export function BroadcastList({ broadcasts, onSelect, selectedId }: BroadcastListProps) {
  const safeList = Array.isArray(broadcasts) ? broadcasts : [];

  if (safeList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <span className="text-4xl mb-3">📭</span>
        <p className="text-sm">Рассылок пока нет. Создайте первую!</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Название</TableHead>
          <TableHead className="text-right">Аудитория</TableHead>
          <TableHead className="text-right">Доставлено</TableHead>
          <TableHead className="text-right">Ошибок</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {safeList.map((broadcast) => (
          <TableRow
            key={broadcast.id}
            className={`cursor-pointer hover:bg-muted/50 ${selectedId === broadcast.id ? 'bg-muted' : ''}`}
            onClick={() => onSelect(broadcast)}
          >
            <TableCell className="font-medium">{broadcast.name}</TableCell>
            <TableCell className="text-right">{broadcast.totalCount}</TableCell>
            <TableCell className="text-right text-green-600">{broadcast.deliveredCount}</TableCell>
            <TableCell className="text-right text-red-500">{broadcast.failedCount}</TableCell>
            <TableCell>
              <BroadcastStatusBadge status={broadcast.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
