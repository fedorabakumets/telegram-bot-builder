/**
 * @fileoverview Шапка панели переменных: счётчик, поиск, raw-редактор, новая переменная
 * @module components/editor/bot/card/BotEnvToolbar
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileCode, Plus, Search } from 'lucide-react';
import { cn } from '@/utils/utils';
import { varsWord } from './build-system-vars';

/** Свойства шапки панели переменных */
interface BotEnvToolbarProps {
  /** Сколько переменных показано */
  totalCount: number;
  /** Открыт raw-редактор */
  showRaw: boolean;
  /** Открыт поиск */
  showSearch: boolean;
  /** Текущая строка фильтра */
  search: string;
  /** Переключить raw-редактор */
  onToggleRaw: () => void;
  /** Переключить поиск */
  onToggleSearch: () => void;
  /** Открыть форму новой переменной */
  onAdd: () => void;
  /** Изменить строку фильтра */
  onSearchChange: (value: string) => void;
}

/**
 * Шапка списка переменных и поле фильтра
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function BotEnvToolbar({
  totalCount, showRaw, showSearch, search,
  onToggleRaw, onToggleSearch, onAdd, onSearchChange,
}: BotEnvToolbarProps) {
  const toolBtn = 'h-8 w-8 rounded-lg text-muted-foreground';

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] tracking-tight">
          <span className="font-medium tabular-nums">{totalCount}</span>
          <span className="ml-1.5 text-muted-foreground">{varsWord(totalCount)}</span>
        </p>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost" size="icon"
            className={cn(toolBtn, showRaw && 'bg-muted text-foreground')}
            onClick={onToggleRaw}
            title="Raw-редактор"
          >
            <FileCode className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className={cn(toolBtn, showSearch && 'bg-muted text-foreground')}
            onClick={onToggleSearch}
            title="Поиск"
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button size="sm" className="ml-1 h-8 gap-1 rounded-lg px-2.5 text-xs shadow-sm" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" /> Новая
          </Button>
        </div>
      </div>

      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Фильтр по имени..."
            className="h-8 rounded-lg pl-8 text-xs"
            autoFocus
          />
        </div>
      )}
    </>
  );
}
