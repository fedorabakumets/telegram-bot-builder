/**
 * @fileoverview Полная секция команды с описанием
 * 
 * Объединяет поле команды и описание для start/command узлов.
 */

import { CommandSection } from './command-section';
import { DescriptionField } from './description-field';

/** Пропсы полной секции команды */
interface CommandSectionCompleteProps {
  /** ID выбранного узла */
  selectedNodeId: string;
  /** Текущее значение команды */
  commandValue: string;
  /** Текущее значение описания */
  descriptionValue: string;
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
 * Компонент полной секции команды с описанием
 * 
 * @param {CommandSectionCompleteProps} props - Пропсы компонента
 * @returns {JSX.Element} Полная секция команды
 */
export function CommandSectionComplete({
  selectedNodeId,
  commandValue,
  descriptionValue,
  isValid,
  errors,
  suggestions,
  showSuggestions,
  onNodeUpdate,
  onNodeIdChange,
  onCommandInput,
  onShowSuggestions
}: CommandSectionCompleteProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <CommandSection
        selectedNodeId={selectedNodeId}
        commandValue={commandValue}
        isValid={isValid}
        errors={errors}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        onNodeUpdate={onNodeUpdate}
        onNodeIdChange={onNodeIdChange}
        onCommandInput={onCommandInput}
        onShowSuggestions={onShowSuggestions}
      />
      <DescriptionField
        selectedNodeId={selectedNodeId}
        descriptionValue={descriptionValue}
        onNodeUpdate={onNodeUpdate}
      />
    </div>
  );
}
