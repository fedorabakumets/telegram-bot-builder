/**
 * @fileoverview Компонент элемента списка переменных
 * Переиспользуемый компонент для dropdown меню
 * @module variable-menu-item
 */

import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { getMediaIcon, getBadgeText, getNodeInfo } from './variable-display-utils';
import type { Variable } from '../../../inline-rich/types';

/** Пропсы компонента VariableMenuItem */
interface VariableMenuItemProps {
  /** Переменная */
  variable: Variable;
  /** Функция выбора переменной */
  onSelect: (variableName: string) => void;
}

/**
 * Компонент элемента списка переменных
 * @param {VariableMenuItemProps} props - Пропсы компонента
 * @returns {JSX.Element} Элемент меню
 */
export function VariableMenuItem({ variable, onSelect }: VariableMenuItemProps) {
  return (
    <DropdownMenuItem
      onClick={() => onSelect(variable.name)}
      className="cursor-pointer"
    >
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center gap-2">
          {getMediaIcon(variable.mediaType)}
          <code className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono font-semibold text-slate-800 dark:text-slate-200">
            {`{${variable.name}}`}
          </code>
        </div>
        <div className="min-w-0">
          {getNodeInfo(variable)}
        </div>
      </div>
    </DropdownMenuItem>
  );
}
