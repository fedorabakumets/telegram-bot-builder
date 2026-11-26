/**
 * @fileoverview Панель поиска и фильтров сценариев
 * @module client/components/editor/scenariy/components/TemplateFilters
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, SlidersHorizontal, ArrowDownWideNarrow } from 'lucide-react';
import { KATEGORII } from '../utils/scenariy-kategorii';
import type { TemplateFiltersProps, SortBy } from '../types/scenariy-tipy';
import { cn } from '@/utils/utils';

/** Метки сортировки */
const METKI_SORTIROVKI: Record<SortBy, string> = {
  popular: 'Популярные',
  rating: 'По рейтингу',
  recent: 'Новые',
  name: 'По алфавиту',
};

const SELECT_TRIGGER =
  'h-10 text-sm rounded-xl border-0 bg-background shadow-none hover:bg-background focus:ring-0 focus:ring-offset-0 focus-visible:underline focus-visible:underline-offset-4';

/**
 * Поиск, категория и сортировка сценариев
 * @param props - свойства
 * @returns JSX элемент
 */
export function TemplateFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
}: TemplateFiltersProps) {
  const hasActive =
    Boolean(searchTerm) || selectedCategory !== 'all' || sortBy !== 'popular';

  /** Сбрасывает все фильтры */
  const resetAll = () => {
    onSearchChange('');
    onCategoryChange('all');
    onSortChange('popular');
  };

  return (
    <div className="space-y-2.5">
      <div className="p-2 sm:p-2.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-600 dark:text-blue-400" />
            <Input
              aria-label="Поиск шаблонов по названию"
              placeholder="Найти шаблон по названию…"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 rounded-lg border-0 bg-background pl-10 pr-9 text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {searchTerm ? (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5 text-sky-700 dark:text-sky-400" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 xs:flex-row lg:w-auto lg:shrink-0">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger aria-label="Категория" className={cn(SELECT_TRIGGER, 'min-w-0 w-full xs:flex-1 lg:w-[200px] [&>svg]:text-emerald-700 dark:[&>svg]:text-emerald-400')}>
                <div className="flex min-w-0 items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                  <SelectValue placeholder="Категория" />
                </div>
              </SelectTrigger>
              <SelectContent className="catalog-text rounded-xl">
                {KATEGORII.map((k) => (
                  <SelectItem key={k.value} value={k.value} className="text-sm focus:bg-transparent focus:text-emerald-700 dark:focus:text-emerald-400">
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortBy)}>
              <SelectTrigger aria-label="Сортировка" className={cn(SELECT_TRIGGER, 'min-w-0 w-full xs:flex-1 lg:w-[180px] [&>svg]:text-violet-700 dark:[&>svg]:text-violet-400')}>
                <div className="flex min-w-0 items-center gap-2">
                  <ArrowDownWideNarrow className="h-3.5 w-3.5 shrink-0 text-violet-700 dark:text-violet-400" />
                  <SelectValue placeholder="Сортировка" />
                </div>
              </SelectTrigger>
              <SelectContent className="catalog-text rounded-xl">
                {(Object.entries(METKI_SORTIROVKI) as [SortBy, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="text-sm focus:bg-transparent focus:text-violet-700 dark:focus:text-violet-400">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {hasActive ? (
        <div className="flex flex-wrap items-center gap-1.5 px-0.5">
          {searchTerm ? (
            <Badge variant="outline" className="max-w-full break-all border-transparent bg-transparent font-normal text-blue-600 dark:text-blue-400">
              Поиск: {searchTerm}
            </Badge>
          ) : null}
          {selectedCategory !== 'all' ? (
            <Badge variant="secondary" className="rounded-lg font-normal">
              {KATEGORII.find((c) => c.value === selectedCategory)?.label}
            </Badge>
          ) : null}
          {sortBy !== 'popular' ? (
            <Badge variant="secondary" className="rounded-lg font-normal">
              {METKI_SORTIROVKI[sortBy]}
            </Badge>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground"
            onClick={resetAll}
          >
            Сбросить
          </Button>
        </div>
      ) : null}
    </div>
  );
}
