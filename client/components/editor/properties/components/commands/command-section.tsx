/**
 * @fileoverview Секция редактирования команды узла
 * 
 * Компонент для настройки команды с автодополнением и валидацией.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CommandAutocompleteDropdown } from './command-autocomplete-dropdown';
import { CommandValidationErrors } from './command-validation-errors';

/** Пропсы компонента секции команды */
interface CommandSectionProps {
  /** ID выбранного узла */
  selectedNodeId: string;
  /** Текущее значение команды */
  commandValue: string;
  /** Флаг валидности команды */
  isValid: boolean;
  /** Список ошибок валидации */
  errors: string[];
  /** Список подсказок команд */
  suggestions: Array<{ command: string; description: string }>;
  /** Флаг отображения подсказок */
  showSuggestions: boolean;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция изменения ID узла */
  onNodeIdChange?: (oldId: string, newId: string) => void;
  /** Функция установки значения команды */
  onCommandInput: (value: string) => void;
  /** Функция установки флага подсказок */
  onShowSuggestions: (show: boolean) => void;
}

/**
 * Компонент секции редактирования команды узла
 * 
 * @param {CommandSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция команды
 */
export function CommandSection({
  selectedNodeId,
  commandValue,
  isValid,
  errors,
  suggestions,
  showSuggestions,
  onNodeUpdate,
  onNodeIdChange,
  onCommandInput,
  onShowSuggestions
}: CommandSectionProps) {
  return (
    <div className="space-y-3 sm:space-y-4 bg-gradient-to-br from-blue-50/40 to-cyan-50/20 dark:from-blue-950/30 dark:to-cyan-900/20 rounded-xl p-3 sm:p-4 border border-blue-200/40 dark:border-blue-800/40 backdrop-blur-sm">
      <div className="space-y-3 sm:space-y-4">
        <div className="relative">
          <Label className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-100">Команда</Label>
          <div className="relative mt-2">
            <Input
              value={commandValue}
              onChange={(e) => {
                const newCommand = e.target.value;
                onNodeUpdate(selectedNodeId, { command: newCommand });
                onCommandInput(newCommand);
                onShowSuggestions(newCommand.length > 0);
              }}
              onFocus={() => onShowSuggestions(true)}
              onBlur={() => setTimeout(() => onShowSuggestions(false), 200)}
              className={`text-sm ${!isValid ? 'border-red-500 dark:border-red-500' : 'border-blue-200 dark:border-blue-700'}`}
              placeholder="/start"
              data-testid="input-command"
            />

            {showSuggestions && suggestions.length > 0 && (
              <CommandAutocompleteDropdown
                suggestions={suggestions}
                selectedNodeId={selectedNodeId}
                onNodeUpdate={onNodeUpdate}
                onNodeIdChange={onNodeIdChange}
                onClose={() => onShowSuggestions(false)}
              />
            )}
          </div>

          {!isValid && errors.length > 0 && (
            <CommandValidationErrors errors={errors} />
          )}
        </div>
      </div>
    </div>
  );
}
