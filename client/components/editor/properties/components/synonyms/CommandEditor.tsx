/**
 * @fileoverview Компонент редактирования команд для узла text_trigger
 *
 * Отображает список связанных command_trigger узлов и позволяет
 * добавлять/удалять команды (каждая команда — отдельный узел на холсте).
 *
 * @module properties/components/synonyms/CommandEditor
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button as UIButton } from '@/components/ui/button';
import type { Node } from '@shared/schema';

/** Пропсы компонента CommandEditor */
export interface CommandEditorProps {
  /** Список связанных command_trigger узлов */
  commandTriggers: Node[];
  /** Добавить команду */
  onCommandAdd: (command: string) => void;
  /** Удалить команду по ID узла */
  onCommandDelete: (triggerId: string) => void;
}

/** Регулярное выражение для валидации команды Telegram */
const COMMAND_REGEX = /^\/[a-zA-Z0-9_]+$/;

/**
 * Компонент редактора команд.
 * Каждая команда — отдельный command_trigger узел на холсте.
 *
 * @param {CommandEditorProps} props - Пропсы компонента
 * @returns {JSX.Element} Компонент редактора команд
 */
export function CommandEditor({
  commandTriggers,
  onCommandAdd,
  onCommandDelete,
}: CommandEditorProps): JSX.Element {
  /** Значение нового поля ввода команды */
  const [newCommand, setNewCommand] = useState('');
  /** Ошибка валидации нового поля */
  const [error, setError] = useState('');

  /**
   * Валидирует команду и возвращает сообщение об ошибке или пустую строку
   */
  const validate = (value: string): string => {
    if (!value.trim()) return 'Введите команду';
    if (!COMMAND_REGEX.test(value)) return 'Команда должна начинаться с / и содержать только латиницу, цифры или _';
    const duplicate = commandTriggers.some(t => (t.data as any).command === value);
    if (duplicate) return 'Такая команда уже существует';
    return '';
  };

  /**
   * Обработчик добавления команды
   */
  const handleAdd = () => {
    const cmd = newCommand.trim();
    const validationError = validate(cmd);
    if (validationError) {
      setError(validationError);
      return;
    }
    onCommandAdd(cmd);
    setNewCommand('');
    setError('');
  };

  /**
   * Обработчик изменения поля ввода — добавляет / если не введён
   */
  const handleInputChange = (value: string) => {
    let normalized = value;
    if (normalized && !normalized.startsWith('/')) {
      normalized = '/' + normalized;
    }
    setNewCommand(normalized);
    if (error) setError('');
  };

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* Список существующих команд */}
      {commandTriggers.map((trigger) => {
        const command = (trigger.data as any).command || '';
        return (
          <div key={trigger.id} className="flex items-center gap-2 sm:gap-2.5">
            <div className="flex-1">
              <Input
                value={command}
                readOnly
                className="h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-3.5 border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 cursor-default"
              />
            </div>
            <UIButton
              onClick={() => onCommandDelete(trigger.id)}
              variant="ghost"
              size="sm"
              className="h-9 sm:h-10 w-9 sm:w-10 p-0 hover:bg-red-100/50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Удалить команду"
            >
              <i className="fas fa-trash text-xs sm:text-sm"></i>
            </UIButton>
          </div>
        );
      })}

      {/* Поле ввода новой команды */}
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex-1">
            <Input
              value={newCommand}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
              placeholder="/команда"
              className={`h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-3.5 border transition-all ${
                error
                  ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-200/50 dark:focus:ring-red-900/50 bg-red-50/30 dark:bg-red-950/20'
                  : 'border-slate-300 dark:border-slate-600 focus:border-yellow-500 focus:ring-yellow-200/50 dark:focus:ring-yellow-900/50'
              }`}
            />
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 pl-3 sm:pl-3.5">
            <i className="fas fa-exclamation-circle text-xs"></i>
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Кнопка добавления */}
      <UIButton
        onClick={handleAdd}
        className="w-full h-9 sm:h-10 text-xs sm:text-sm font-medium bg-gradient-to-r from-yellow-500 to-orange-500 dark:from-yellow-600 dark:to-orange-600 hover:from-yellow-600 hover:to-orange-600 dark:hover:from-yellow-700 dark:hover:to-orange-700 shadow-md hover:shadow-lg transition-all text-white"
      >
        <i className="fas fa-plus mr-2"></i>
        <span className="hidden sm:inline">Добавить команду</span>
        <span className="sm:hidden">Добавить</span>
      </UIButton>
    </div>
  );
}
