/**
 * @fileoverview Компонент поля поиска пользователей
 * @description Input с иконкой поиска для фильтрации пользователей
 */

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

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
    <div className="relative group">
      <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center transition-colors group-focus-within:bg-primary/20">
        <Search className="w-4 h-4 text-primary" />
      </div>
      <Input
        placeholder="Поиск по имени, username или ID..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-14 sm:pl-16 pr-4 h-11 sm:h-12 text-sm sm:text-base rounded-xl border-2 border-transparent bg-background shadow-sm hover:border-primary/20 focus:border-primary/40 focus:ring-0 transition-all"
        data-testid="input-search-users"
      />
    </div>
  );
}
