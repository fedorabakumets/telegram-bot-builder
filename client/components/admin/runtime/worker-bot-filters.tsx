/** @fileoverview Поиск и выбор режима в списке ботов исполнителя. */
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/** Параметры фильтрации списка. */
interface Props {
  /** Текст поиска по имени бота или проекту. */
  search: string;
  /** Выбранный режим либо все режимы. */
  mode: string;
  /** Изменяет поисковый запрос. */
  onSearch: (value: string) => void;
  /** Изменяет фильтр режима. */
  onMode: (value: string) => void;
}
/** Показывает доступные серверные фильтры без потери фокуса при обновлении. */
export function WorkerBotFilters({ search, mode, onSearch, onMode }: Props) {
  return <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
    <label className="min-w-0 space-y-2 text-xs text-muted-foreground">
      <span>Поиск бота или проекта</span>
      <span className="relative block"><Search aria-hidden="true" className="absolute left-3 top-3 size-4" />
        <Input value={search} onChange={event => onSearch(event.target.value)} maxLength={100} placeholder="Название, username или проект" className="pl-9 bg-transparent" />
      </span>
    </label>
    <label className="space-y-2 text-xs text-muted-foreground"><span className="block">Режим запуска</span>
      <select value={mode} onChange={event => onMode(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-64">
        <option value="all">Все режимы</option>
        <option value="direct">Постоянная работа</option>
        <option value="ondemand">Сон при простое</option>
        <option value="process">Освобождение памяти</option>
      </select>
    </label>
  </div>;
}
