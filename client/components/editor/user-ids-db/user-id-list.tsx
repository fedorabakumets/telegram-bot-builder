/**
 * @fileoverview Список ID пользователей с таблицей
 * Отображает список ID с возможностью удаления
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Search } from 'lucide-react';

/**
 * Запись ID пользователя
 */
export interface UserIdRecord {
  id: number;
  userId: string;
  createdAt: string;
  source: 'manual' | 'import' | 'bot';
}

interface UserIdListProps {
  /** Список ID записей */
  items: UserIdRecord[];
  /** Загрузка данных */
  isLoading?: boolean;
  /** Обработчик удаления */
  onDelete: (ids: number[]) => void;
  /** Обработчик удаления одного ID */
  onDeleteOne?: (id: number) => void;
}

/**
 * Компонент списка ID пользователей
 */
export function UserIdList({
  items,
  isLoading = false,
  onDelete,
  onDeleteOne,
}: UserIdListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = items.filter((item) =>
    item.userId.includes(searchQuery)
  );

  if (isLoading) {
    return <div className="text-center py-8">Загрузка...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Таблица */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 text-left font-semibold">ID пользователя</th>
              <th className="p-3 text-left font-semibold">Дата добавления</th>
              <th className="p-3 text-left font-semibold">Источник</th>
              <th className="p-3 text-left font-semibold"></th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr
                key={item.id}
                className="border-t hover:bg-muted/30 transition-colors"
              >
                <td className="p-3 font-mono text-sm">{item.userId}</td>
                <td className="p-3 text-sm text-muted-foreground">
                  {new Date(item.createdAt).toLocaleString('ru-RU')}
                </td>
                <td className="p-3">
                  <SourceBadge source={item.source} />
                </td>
                <td className="p-3 text-right">
                  {onDeleteOne && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => onDeleteOne(item.id)}
                      aria-label={`Удалить ID ${item.userId}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? 'Ничего не найдено'
              : 'Список пуст'}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Бейдж источника добавления
 */
function SourceBadge({ source }: { source: string }) {
  const badges = {
    manual: { label: 'Ручное', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    import: { label: 'Импорт', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    bot: { label: 'Бот', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  };

  const badge = badges[source as keyof typeof badges] || badges.manual;

  return (
    <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
      {badge.label}
    </span>
  );
}
