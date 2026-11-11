/**
 * @fileoverview Компонент поля поиска пользователей
 * @description Input с иконкой поиска для фильтрации пользователей
 */

import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

/**
 * Пропсы компонента SearchInput
 */
interface SearchInputProps {
  /** Текущий поисковый запрос */
  value: string;
  /** Функция изменения запроса */
  onChange: (value: string) => void;
}

/**
 * Компонент поиска пользователей
 * @param props - Пропсы компонента
 * @returns JSX компонент поиска
 */
export function SearchInput({ value, onChange }: SearchInputProps): React.JSX.Element {
  return (
    <div className="relative min-w-0">
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>
      <Input
        type="search"
        aria-label="Поиск пользователей по имени, username или ID"
        placeholder="Имя, username или ID"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-border/60 bg-background pl-10 pr-10 text-sm shadow-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/40 [&::-webkit-search-cancel-button]:appearance-none"
        data-testid="input-search-users"
      />
      {value && (
        <button
          type="button"
          aria-label="Очистить поиск пользователей"
          onClick={() => onChange('')}
          className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
