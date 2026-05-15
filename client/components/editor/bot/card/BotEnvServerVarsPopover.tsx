/**
 * @fileoverview Попover для выбора серверных переменных окружения
 * Кнопка {} открывает список переменных из серверного .env для подстановки
 * @module components/editor/bot/card/BotEnvServerVarsPopover
 */

import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Server, Loader2 } from 'lucide-react';
import { useState } from 'react';

/** Элемент серверной переменной */
interface ServerEnvItem {
  /** Имя переменной */
  key: string;
  /** Реальное значение */
  value: string;
  /** Маскированное значение для отображения */
  maskedValue: string;
}

/** Свойства компонента */
interface BotEnvServerVarsPopoverProps {
  /** Колбэк при выборе переменной — передаёт реальное значение */
  onSelect: (value: string) => void;
}

/**
 * Попover с серверными переменными окружения для подстановки значений
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvServerVarsPopover({ onSelect }: BotEnvServerVarsPopoverProps) {
  /** Состояние открытия попова */
  const [open, setOpen] = useState(false);

  /** Запрос списка серверных переменных */
  const { data, isLoading } = useQuery<{ items: ServerEnvItem[] }>({
    queryKey: ['/api/server/env-keys'],
    enabled: open,
    staleTime: 5 * 60 * 1000,
  });

  /** Обработчик выбора переменной */
  function handleSelect(item: ServerEnvItem) {
    onSelect(item.value);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          title="Подставить из сервера"
          type="button"
        >
          <Server className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-0">
        <div className="px-3 py-2 border-b">
          <span className="text-xs font-medium text-muted-foreground">
            🖥️ Серверные переменные
          </span>
        </div>
        <div className="max-h-56 overflow-y-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {data?.items?.length === 0 && (
            <div className="px-3 py-3 text-xs text-muted-foreground text-center">
              Нет доступных переменных
            </div>
          )}
          {data?.items?.map((item) => (
            <button
              key={item.key}
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/60 transition-colors"
              onClick={() => handleSelect(item)}
            >
              <span className="text-xs font-mono font-medium text-foreground">
                {item.key}
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
