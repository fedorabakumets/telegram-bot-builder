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
  /** Режим: "text" — шаблон, "expression" — выражение, "lookup" — поиск в таблице, "str_replace" — замена подстроки, "random" — случайное число, "random_item" — случайный элемент из списка, "array_item" — элемент массива/объекта по индексу/ключу, "timestamp" — временная метка */
  mode: 'text' | 'expression' | 'lookup' | 'str_replace' | 'random' | 'random_item' | 'array_item' | 'timestamp';
  /** Имя таблицы для поиска (только lookup) */
  lookupTable?: string;
  /** Поле таблицы для извлечения (только lookup) */
  lookupField?: string;
  /** Условия поиска (только lookup) */
  lookupWhere?: Array<{ field: string; value: string }>;
  /** На что заменить (только str_replace) */
  replaceWith?: string;
  /** Максимальное значение для mode=random */
  maxValue?: string;
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

  /** Переключает режим между text, expression, lookup, str_replace, random, random_item, array_item и timestamp */
  const handleModeToggle = () => {
    const modes: Array<'text' | 'expression' | 'lookup' | 'str_replace' | 'random' | 'random_item' | 'array_item' | 'timestamp'> = ['text', 'expression', 'lookup', 'str_replace', 'random', 'random_item', 'array_item', 'timestamp'];
    const currentIdx = modes.indexOf(assignment.mode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    onChange(assignment.id, 'mode', nextMode);
  };

  const isExpression = assignment.mode === 'expression';
  const isLookup = assignment.mode === 'lookup';
  const isStrReplace = assignment.mode === 'str_replace';
  const isRandom = assignment.mode === 'random';
  const isRandomItem = assignment.mode === 'random_item';
  const isArrayItem = assignment.mode === 'array_item';
  const isTimestamp = assignment.mode === 'timestamp';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {/* Переключатель режима T / = / 🔍 / ✂️ / 🎲 / 🎯 / 📋 / ⏱ */}
        <Button
          variant={isExpression ? 'default' : isLookup ? 'secondary' : isStrReplace ? 'secondary' : isRandom ? 'secondary' : isRandomItem ? 'secondary' : isArrayItem ? 'secondary' : isTimestamp ? 'secondary' : 'outline'}
          size="icon"
          className="h-8 w-8 flex-shrink-0 text-xs font-mono"
          title={isExpression
            ? 'Режим: выражение. Нажмите для lookup'
            : isLookup
            ? 'Режим: поиск в таблице. Нажмите для замены'
            : isStrReplace
            ? 'Режим: замена подстроки. Нажмите для случайного числа'
            : isRandom
            ? 'Режим: случайное число. Нажмите для случайного элемента'
            : isRandomItem
            ? 'Режим: случайный элемент. Нажмите для элемента массива'
            : isArrayItem
            ? 'Режим: элемент массива/объекта. Нажмите для временной метки'
            : isTimestamp
            ? 'Режим: временная метка. Нажмите для текста'
            : 'Режим: текст/шаблон. Нажмите для выражения'}
          onClick={handleModeToggle}
        >
          {isExpression ? '=' : isLookup ? '🔍' : isStrReplace ? '✂️' : isRandom ? '🎲' : isRandomItem ? '🎯' : isArrayItem ? '📋' : isTimestamp ? '⏱' : 'T'}
        </Button>

        {!isLookup && !isStrReplace && !isRandom && !isRandomItem && !isArrayItem && !isTimestamp && (
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

        {isRandom && (
          <div className="flex-1 flex items-center gap-1">
            <Input
              placeholder="Мин. значение"
              value={assignment.value || ''}
              onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
              className="flex-1 text-xs h-8 border-green-400 dark:border-green-600 bg-green-50/30 dark:bg-green-950/20"
            />
            <span className="text-muted-foreground text-[10px]">—</span>
            <Input
              placeholder="Макс. значение"
              value={assignment.maxValue || ''}
              onChange={(e) => onChange(assignment.id, 'maxValue' as any, e.target.value)}
              className="flex-1 text-xs h-8 border-green-400 dark:border-green-600 bg-green-50/30 dark:bg-green-950/20"
            />
            <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
          </div>
        )}

        {isRandomItem && (
          <div className="flex-1 flex items-center gap-1">
            <Input
              placeholder="элемент1, элемент2, элемент3"
              value={assignment.value || ''}
              onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
              className="flex-1 text-xs h-8 border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20"
            />
            <VariableSelector
              availableVariables={textVariables}
              onSelect={handleInsertVariable}
            />
            <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
          </div>
        )}

        {isArrayItem && (
          <div className="flex-1 flex items-center gap-1">
            <Input
              placeholder="{переменная}"
              value={assignment.value || ''}
              onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
              className="flex-1 text-xs h-8 border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20"
            />
            <span className="text-muted-foreground text-[10px]">.</span>
            <Input
              placeholder="0 или ключ или {переменная}"
              value={assignment.maxValue || ''}
              onChange={(e) => onChange(assignment.id, 'maxValue' as any, e.target.value)}
              className="flex-1 text-xs h-8 border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-950/20"
            />
            <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
          </div>
        )}

        {isTimestamp && (
          <div className="flex-1 flex items-center gap-1">
            <Input
              placeholder="Смещение в секундах (0 = текущее время)"
              value={assignment.value || ''}
              onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
              className="flex-1 text-xs h-8 border-cyan-400 dark:border-cyan-600 bg-cyan-50/30 dark:bg-cyan-950/20"
            />
            <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
          </div>
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

        {isStrReplace && (
          <div className="flex-1 flex items-center gap-1">
            <Input
              placeholder="искать"
              value={assignment.value || ''}
              onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
              className="flex-1 text-xs h-8 border-purple-400 dark:border-purple-600 bg-purple-50/30 dark:bg-purple-950/20"
            />
            <span className="text-muted-foreground text-[10px]">→</span>
            <Input
              placeholder="заменить на"
              value={assignment.replaceWith || ''}
              onChange={(e) => onChange(assignment.id, 'replaceWith' as any, e.target.value)}
              className="flex-1 text-xs h-8 border-purple-400 dark:border-purple-600 bg-purple-50/30 dark:bg-purple-950/20"
            />
            <span className="text-muted-foreground text-xs flex-shrink-0">в →</span>
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
