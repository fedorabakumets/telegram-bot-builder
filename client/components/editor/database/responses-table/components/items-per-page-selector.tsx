/**
 * @fileoverview Компонент выбора количества элементов на странице
 * @description Выпадающий список для выбора размера страницы
 */

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ItemsPerPageSelectorProps, ItemsPerPageValue } from '../types';

/**
 * Опции количества элементов на странице
 */
const ITEMS_PER_PAGE_OPTIONS: ItemsPerPageValue[] = [12, 25, 50, 100];

/**
 * Компонент выбора количества элементов
 * @param props - Пропсы компонента
 * @returns JSX компонент селектора
 */
export function ItemsPerPageSelector({
  value,
  onChange,
}: ItemsPerPageSelectorProps): React.JSX.Element {
  return (
    <Select
      value={value.toString()}
      onValueChange={(val) => onChange(Number(val) as ItemsPerPageValue)}
    >
      <SelectTrigger aria-label="Количество ответов на странице" className="w-20 h-9">
        <SelectValue placeholder="12" />
      </SelectTrigger>
      <SelectContent className="users-portal">
        {ITEMS_PER_PAGE_OPTIONS.map((option) => (
          <SelectItem key={option} value={option.toString()}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
