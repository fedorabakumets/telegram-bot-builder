/**
 * @fileoverview Переиспользуемое содержимое дропдауна выбора переменных
 * @description Рендерит поле поиска (при большом числе переменных) и
 * отфильтрованный список VariableMenuItem. Вставляется внутрь любого
 * DropdownMenuContent. Заголовок ("📌 Доступные переменные") оставляется
 * в местах вызова. Внутренний стейт поиска сбрасывается автоматически,
 * так как Radix размонтирует содержимое дропдауна при закрытии.
 * @module variable-list-content
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { VariableMenuItem } from './variable-menu-item';
import type { Variable } from '../types';

/** Порог, начиная с которого показывается поле поиска */
const SEARCH_THRESHOLD = 7;

/** Пропсы компонента VariableListContent */
interface VariableListContentProps {
  /** Доступные переменные */
  availableVariables: Variable[];
  /** Функция выбора переменной по имени */
  onSelect: (variableName: string) => void;
  /** Текст для состояния «нет переменных» */
  emptyText?: string;
}

/**
 * Содержимое дропдауна: поиск + отфильтрованный список переменных
 * @param props - Пропсы компонента
 * @returns JSX элемент с поиском и списком переменных
 */
export function VariableListContent({
  availableVariables,
  onSelect,
  emptyText = 'Нет переменных. Добавьте узел со сбором медиа-ввода.'
}: VariableListContentProps) {
  /** Текущий поисковый запрос по имени/описанию переменной */
  const [search, setSearch] = useState('');

  /** Показывать поле поиска только когда переменных много */
  const showSearch = availableVariables.length > SEARCH_THRESHOLD;

  /** Отфильтрованный список переменных по подстроке в имени или описании */
  const query = search.trim().toLowerCase();
  const filteredVariables = query
    ? availableVariables.filter((variable) =>
        variable.name.toLowerCase().includes(query) ||
        (variable.description?.toLowerCase().includes(query) ?? false)
      )
    : availableVariables;

  return (
    <>
      {showSearch && (
        <div className="relative px-1 pb-1.5" onClick={(e) => e.stopPropagation()}>
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Поиск переменной..."
            className="h-7 text-xs pl-7 pr-2 py-0"
          />
        </div>
      )}
      {availableVariables.length === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground text-center">
          {emptyText}
        </div>
      ) : filteredVariables.length === 0 ? (
        <div className="px-3 py-4 text-xs text-muted-foreground text-center">
          Ничего не найдено
        </div>
      ) : (
        filteredVariables.map((variable, index) => (
          <VariableMenuItem
            key={`${variable.nodeId}-${variable.name}-${index}`}
            variable={variable}
            onSelect={onSelect}
          />
        ))
      )}
    </>
  );
}
