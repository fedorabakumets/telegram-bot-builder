/**
 * @fileoverview Компонент элемента списка переменных
 * Переиспользуемый компонент для dropdown меню
 * @module variable-menu-item
 */

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { getMediaIcon, getNodeInfo } from './variable-display-utils';
import { getVariableExample } from './system-variable-examples';
import type { Variable } from '../types';

/** Пропсы компонента VariableMenuItem */
interface VariableMenuItemProps {
  /** Переменная */
  variable: Variable;
  /** Функция выбора переменной */
  onSelect: (variableName: string) => void;
  /** Подстрока поиска для подсветки совпадения в имени (регистронезависимо) */
  highlight?: string;
}

/**
 * Рендерит имя переменной с подсветкой совпавшей подстроки
 * @param name - Оригинальное имя переменной
 * @param highlight - Подстрока поиска (может быть пустой)
 * @returns Фрагмент JSX с подсветкой через <mark> либо обычное имя
 */
function renderHighlightedName(name: string, highlight?: string) {
  const term = highlight?.trim();
  if (!term) return name;

  // Поиск регистронезависимый, регистр имени в выводе сохраняется
  const matchIndex = name.toLowerCase().indexOf(term.toLowerCase());
  if (matchIndex === -1) return name;

  const before = name.slice(0, matchIndex);
  const match = name.slice(matchIndex, matchIndex + term.length);
  const after = name.slice(matchIndex + term.length);

  return (
    <>
      {before}
      <mark className="bg-yellow-200 dark:bg-yellow-700/50 rounded-sm">{match}</mark>
      {after}
    </>
  );
}

/**
 * Компонент элемента списка переменных
 * @param {VariableMenuItemProps} props - Пропсы компонента
 * @returns {JSX.Element} Элемент меню
 */
export function VariableMenuItem({ variable, onSelect, highlight }: VariableMenuItemProps) {
  /** Пример значения для системной переменной (для пользовательских — undefined) */
  const example = getVariableExample(variable.name);

  return (
    <DropdownMenuItem
      onClick={() => onSelect(variable.name)}
      className="cursor-pointer"
    >
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-2">
          {getMediaIcon(variable.mediaType)}
          <code className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono font-semibold text-slate-800 dark:text-slate-200">
            {'{'}
            {renderHighlightedName(variable.name, highlight)}
            {'}'}
          </code>
        </div>
        <div className="min-w-0">
          {getNodeInfo(variable)}
          {example && (
            <div className="text-[10px] text-muted-foreground">
              {`например: ${example}`}
            </div>
          )}
        </div>
      </div>
    </DropdownMenuItem>
  );
}
