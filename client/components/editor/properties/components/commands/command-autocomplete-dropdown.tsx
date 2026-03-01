/**
 * @fileoverview Выпадающий список автодополнения команд
 * 
 * Отображает подсказки команд при вводе.
 */

import { Button } from '@/components/ui/button';

/** Пропсы компонента автодополнения команд */
interface CommandAutocompleteDropdownProps {
  /** Список подсказок команд */
  suggestions: Array<{ command: string; description: string }>;
  /** ID выбранного узла */
  selectedNodeId: string;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция изменения ID узла */
  onNodeIdChange?: (oldId: string, newId: string) => void;
  /** Функция закрытия dropdown */
  onClose: () => void;
}

/**
 * Компонент выпадающего списка автодополнения команд
 * 
 * @param {CommandAutocompleteDropdownProps} props - Пропсы компонента
 * @returns {JSX.Element} Dropdown с подсказками команд
 */
export function CommandAutocompleteDropdown({
  suggestions,
  selectedNodeId,
  onNodeUpdate,
  onNodeIdChange,
  onClose
}: CommandAutocompleteDropdownProps) {
  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="ghost"
          className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-xs sm:text-sm border-b border-blue-100 dark:border-blue-900 last:border-b-0 transition-colors h-auto justify-start"
          onClick={() => {
            onNodeUpdate(selectedNodeId, {
              command: suggestion.command,
              description: suggestion.description
            });

            const newId = suggestion.command.replace(/^\//, '').toLowerCase() || selectedNodeId;
            if (onNodeIdChange && newId !== selectedNodeId) {
              onNodeIdChange(selectedNodeId, newId);
            }

            onClose();
          }}
          data-testid={`button-suggestion-${suggestion.command}`}
        >
          <div className="font-semibold text-foreground">{suggestion.command}</div>
          <div className="text-xs text-muted-foreground">{suggestion.description}</div>
        </Button>
      ))}
    </div>
  );
}
