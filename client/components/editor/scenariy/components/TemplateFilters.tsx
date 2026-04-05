/**
 * @fileoverview Компонент фильтров: поиск, категория и сортировка сценариев
 * @module client/components/editor/scenariy/components/TemplateFilters
 */

import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, SortAsc } from 'lucide-react';
import { KATEGORII } from '../utils/scenariy-kategorii';
import type { TemplateFiltersProps, SortBy } from '../types/scenariy-tipy';

/** Метки для значений сортировки */
const METKI_SORTIROVKI: Record<SortBy, string> = {
  popular: 'Популярные',
  rating: 'По рейтингу',
  recent: 'Новые',
  name: 'По алфавиту',
};

/**
 * Панель фильтров: поиск по тексту, выбор категории и сортировка
 * @param props - свойства компонента
 * @returns JSX элемент панели фильтров
 */
export function TemplateFilters({ searchTerm, onSearchChange, selectedCategory, onCategoryChange, sortBy, onSortChange }: TemplateFiltersProps) {
  const aktivnyeFiltery = searchTerm || selectedCategory !== 'all' || sortBy !== 'popular';

  return (
    <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card/60 to-card/40 dark:from-card/50 dark:to-card/30 p-3 xs:p-4 sm:p-5 space-y-3 xs:space-y-4 backdrop-blur-sm hover:border-border/60 transition-all duration-300">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500/50 h-4 w-4 group-focus-within:text-blue-600 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
        <Input placeholder="Поиск сценариев по названию..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} className="pl-10 h-10 xs:h-11 text-sm xs:text-base border border-border/50 rounded-lg bg-background/80 hover:bg-background hover:border-border/70 focus:border-blue-500/60 focus:ring-blue-500/15 transition-all duration-200 shadow-sm" />
      </div>

      <div className="flex flex-col xs:flex-row gap-2.5 xs:gap-3">
        <div className="flex-1 relative z-40">
          <div className="flex items-center gap-1.5 mb-2 xs:mb-0">
            <Filter className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Категория</span>
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="ml-1 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                {KATEGORII.find(c => c.value === selectedCategory)?.label}
              </Badge>
            )}
          </div>
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full h-9 xs:h-10 text-xs xs:text-sm border border-border/60 rounded-lg bg-background/80 hover:bg-background hover:border-blue-500/40 focus:border-blue-500/60 focus:ring-blue-500/15 transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 hidden xs:block" />
                <SelectValue placeholder="Выбрать категорию" />
              </div>
            </SelectTrigger>
            <SelectContent className="z-50 rounded-lg">
              {KATEGORII.map((k) => <SelectItem key={k.value} value={k.value} className="text-sm">{k.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 relative z-40">
          <div className="flex items-center gap-1.5 mb-2 xs:mb-0">
            <SortAsc className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Сортировка</span>
            {sortBy !== 'popular' && (
              <Badge variant="secondary" className="ml-1 text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                {METKI_SORTIROVKI[sortBy]}
              </Badge>
            )}
          </div>
          <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortBy)}>
            <SelectTrigger className="w-full h-9 xs:h-10 text-xs xs:text-sm border border-border/60 rounded-lg bg-background/80 hover:bg-background hover:border-amber-500/40 focus:border-amber-500/60 focus:ring-amber-500/15 transition-all duration-200 shadow-sm">
              <div className="flex items-center gap-2">
                <SortAsc className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 hidden xs:block" />
                <SelectValue placeholder="Сортировка" />
              </div>
            </SelectTrigger>
            <SelectContent className="z-50 rounded-lg">
              {(Object.entries(METKI_SORTIROVKI) as [SortBy, string][]).map(([val, label]) => (
                <SelectItem key={val} value={val} className="text-sm">{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {aktivnyeFiltery && (
        <div className="pt-2 border-t border-border/30">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground">Фильтры активны:</span>
            {searchTerm && <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">Поиск: {searchTerm}</Badge>}
            {selectedCategory !== 'all' && <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">{KATEGORII.find(c => c.value === selectedCategory)?.label}</Badge>}
            {sortBy !== 'popular' && <Badge variant="outline" className="text-xs bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300">Сортировка: {METKI_SORTIROVKI[sortBy]}</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}
