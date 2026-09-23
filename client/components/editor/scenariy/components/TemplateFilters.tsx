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
  'h-10 text-sm rounded-xl border-border/50 bg-background/70 shadow-none hover:bg-background hover:border-border focus:ring-1 focus:ring-primary/20';

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
      <div
        className={cn(
          'rounded-2xl border border-border/50 bg-card/40 p-2 sm:p-2.5',
          'shadow-sm shadow-black/[0.02] dark:shadow-none',
        )}
      >
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500 dark:text-blue-400" />
            <Input
              placeholder="Найти шаблон по названию…"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="h-10 rounded-xl border border-blue-500/35 bg-background pl-10 pr-9 text-sm shadow-none placeholder:text-muted-foreground/60 ring-1 ring-blue-500/20 focus-visible:ring-blue-500/35 focus-visible:border-blue-500/50"
            />
            {searchTerm ? (
              <button
                type="button"
                aria-label="Очистить поиск"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-col gap-2 xs:flex-row lg:w-auto lg:shrink-0">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className={cn(SELECT_TRIGGER, 'w-full xs:flex-1 lg:w-[200px]')}>
                <div className="flex min-w-0 items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Категория" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {KATEGORII.map((k) => (
                  <SelectItem key={k.value} value={k.value} className="text-sm">
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortBy)}>
              <SelectTrigger className={cn(SELECT_TRIGGER, 'w-full xs:flex-1 lg:w-[180px]')}>
                <div className="flex min-w-0 items-center gap-2">
                  <ArrowDownWideNarrow className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <SelectValue placeholder="Сортировка" />
                </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {(Object.entries(METKI_SORTIROVKI) as [SortBy, string][]).map(([val, label]) => (
                  <SelectItem key={val} value={val} className="text-sm">
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
            <Badge variant="secondary" className="gap-1 rounded-lg font-normal">
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
