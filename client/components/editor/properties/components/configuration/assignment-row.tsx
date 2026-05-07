/**
 * @fileoverview Строка присваивания переменной с переключателем режима
 * @module components/editor/properties/components/configuration/assignment-row
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { VariableNameInput } from '../variables/variable-name-input';
import { VariableSelector } from '../variables/variable-selector';
import type { Variable } from '../../../inline-rich/types';

/** Одно присваивание переменной */
export interface Assignment {
  /** Уникальный идентификатор */
  id: string;
  /** Имя переменной */
  variable: string;
  /** Значение или шаблон */
  value: string;
  /** Режим: "text" — шаблон, "expression" — арифметическое выражение */
  mode: 'text' | 'expression';
}

/** Пропсы строки присваивания */
interface AssignmentRowProps {
  /** Данные присваивания */
  assignment: Assignment;
  /** Обработчик изменения поля */
  onChange: (id: string, field: 'variable' | 'value' | 'mode', val: string) => void;
  /** Обработчик удаления строки */
  onRemove: (id: string) => void;
  /** Можно ли удалить строку */
  canRemove: boolean;
  /** Доступные переменные для вставки */
  textVariables: Variable[];
}

/**
 * Строка одного присваивания переменной с переключателем режима T / =
 * @param props - Пропсы строки
 * @returns JSX-элемент строки присваивания
 */
export function AssignmentRow({
  assignment,
  onChange,
  onRemove,
  canRemove,
  textVariables,
}: AssignmentRowProps) {
  /**
   * Вставляет переменную в поле значения в формате {varName}
   * @param varName - имя переменной для вставки
   */
  const handleInsertVariable = (varName: string) => {
    onChange(assignment.id, 'value', assignment.value + `{${varName}}`);
  };

  /** Переключает режим между text и expression */
  const handleModeToggle = () => {
    onChange(assignment.id, 'mode', assignment.mode === 'text' ? 'expression' : 'text');
  };

  const isExpression = assignment.mode === 'expression';

  return (
    <div className="flex items-center gap-1.5">
      {/* Поле имени переменной с селектором */}
      <div className="flex-1">
        <VariableNameInput
          value={assignment.variable}
          availableVariables={textVariables}
          onChange={(val) => onChange(assignment.id, 'variable', val)}
          placeholder="имя_переменной"
        />
      </div>

      <span className="text-muted-foreground text-xs flex-shrink-0">→</span>

      {/* Переключатель режима T / = */}
      <Button
        variant={isExpression ? 'default' : 'outline'}
        size="icon"
        className="h-8 w-8 flex-shrink-0 text-xs font-mono"
        title={isExpression
          ? 'Режим: выражение. Нажмите для текста'
          : 'Режим: текст/шаблон. Нажмите для выражения'}
        onClick={handleModeToggle}
      >
        {isExpression ? '=' : 'T'}
      </Button>

      {/* Поле значения с кнопкой вставки переменной */}
      <div className="flex-1 flex items-center gap-1">
        <Input
          placeholder={isExpression ? '{step} + 1' : 'значение или {переменная}'}
          value={assignment.value}
          onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
          className={`flex-1 text-xs h-8 ${isExpression
            ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/20'
            : ''}`}
        />
        <VariableSelector
          availableVariables={textVariables}
          onSelect={handleInsertVariable}
        />
      </div>

      {canRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-muted-foreground hover:text-destructive"
          onClick={() => onRemove(assignment.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
