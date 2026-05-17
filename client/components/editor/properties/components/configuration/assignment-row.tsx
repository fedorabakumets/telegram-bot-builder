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
  /** Режим: "text" — шаблон, "expression" — выражение, "lookup" — поиск в таблице */
  mode: 'text' | 'expression' | 'lookup';
  /** Имя таблицы для поиска (только lookup) */
  lookupTable?: string;
  /** Поле таблицы для извлечения (только lookup) */
  lookupField?: string;
  /** Условия поиска (только lookup) */
  lookupWhere?: Array<{ field: string; value: string }>;
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

  /** Переключает режим между text, expression и lookup */
  const handleModeToggle = () => {
    const modes: Array<'text' | 'expression' | 'lookup'> = ['text', 'expression', 'lookup'];
    const currentIdx = modes.indexOf(assignment.mode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    onChange(assignment.id, 'mode', nextMode);
  };

  const isExpression = assignment.mode === 'expression';
  const isLookup = assignment.mode === 'lookup';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {/* Переключатель режима T / = / 🔍 */}
        <Button
          variant={isExpression ? 'default' : isLookup ? 'secondary' : 'outline'}
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-xs font-mono"
          title={isExpression
            ? 'Режим: выражение. Нажмите для lookup'
            : isLookup
            ? 'Режим: поиск в таблице. Нажмите для текста'
            : 'Режим: текст/шаблон. Нажмите для выражения'}
          onClick={handleModeToggle}
        >
          {isExpression ? '=' : isLookup ? '🔍' : 'T'}
        </Button>

        {!isLookup && (
          <>
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

            <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
          </>
        )}

        {isLookup && (
          <div className="flex-1 flex items-center gap-1">
            <Input
              placeholder="таблица"
              value={assignment.lookupTable || ''}
              onChange={(e) => onChange(assignment.id, 'lookupTable' as any, e.target.value)}
              className="w-24 text-xs h-8 border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
            />
            <span className="text-muted-foreground text-[10px]">.</span>
            <Input
              placeholder="поле"
              value={assignment.lookupField || ''}
              onChange={(e) => onChange(assignment.id, 'lookupField' as any, e.target.value)}
              className="w-20 text-xs h-8 border-blue-400 dark:border-blue-600 bg-blue-50/30 dark:bg-blue-950/20"
            />
            <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
          </div>
        )}

        {/* Поле имени переменной с селектором */}
        <div className="flex-1">
          <VariableNameInput
            value={assignment.variable}
            availableVariables={textVariables}
            onChange={(val) => onChange(assignment.id, 'variable', val)}
            placeholder="имя_переменной"
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

      {/* Условия lookup */}
      {isLookup && (
        <div className="ml-10 space-y-1">
          <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">Условия поиска (WHERE):</p>
          {(assignment.lookupWhere || []).map((cond, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <Input
                placeholder="поле"
                value={cond.field}
                onChange={(e) => {
                  const updated = [...(assignment.lookupWhere || [])];
                  updated[idx] = { ...updated[idx], field: e.target.value };
                  onChange(assignment.id, 'lookupWhere' as any, updated as any);
                }}
                className="w-24 text-xs h-6"
              />
              <span className="text-muted-foreground text-[10px]">=</span>
              <Input
                placeholder="{переменная}"
                value={cond.value}
                onChange={(e) => {
                  const updated = [...(assignment.lookupWhere || [])];
                  updated[idx] = { ...updated[idx], value: e.target.value };
                  onChange(assignment.id, 'lookupWhere' as any, updated as any);
                }}
                className="flex-1 text-xs h-6"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => {
                  const updated = (assignment.lookupWhere || []).filter((_, i) => i !== idx);
                  onChange(assignment.id, 'lookupWhere' as any, updated as any);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-[10px] text-blue-600"
            onClick={() => {
              const updated = [...(assignment.lookupWhere || []), { field: '', value: '' }];
              onChange(assignment.id, 'lookupWhere' as any, updated as any);
            }}
          >
            + условие
          </Button>
        </div>
      )}
    </div>
  );
}
