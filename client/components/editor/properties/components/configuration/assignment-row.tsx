/**
 * @fileoverview Строка присваивания переменной с dropdown-выбором режима
 * @module components/editor/properties/components/configuration/assignment-row
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  /** Режим присваивания */
  mode: AssignmentMode;
  /** Имя таблицы для поиска (только lookup) */
  lookupTable?: string;
  /** Поле таблицы для извлечения (только lookup) */
  lookupField?: string;
  /** Условия поиска (только lookup) */
  lookupWhere?: Array<{ field: string; value: string }>;
  /** На что заменить (только str_replace) */
  replaceWith?: string;
  /** Максимальное значение для mode=random, индекс для array_item */
  maxValue?: string;
}

/** Все доступные режимы присваивания */
type AssignmentMode =
  | 'text'
  | 'expression'
  | 'lookup'
  | 'str_replace'
  | 'random'
  | 'random_item'
  | 'array_item'
  | 'timestamp'
  | 'format_duration'
  | 'format_number';

/** Конфигурация режима для отображения в dropdown */
interface ModeConfig {
  /** Иконка режима */
  icon: string;
  /** Название режима */
  label: string;
  /** Краткое описание */
  hint: string;
  /** Цвет бордера поля ввода */
  borderClass: string;
}

/** Конфигурации всех режимов */
const MODE_CONFIGS: Record<AssignmentMode, ModeConfig> = {
  text: {
    icon: 'T',
    label: 'Текст',
    hint: 'Подстановка строки или {переменной}',
    borderClass: '',
  },
  expression: {
    icon: '=',
    label: 'Выражение',
    hint: 'Арифметика: +, -, *, /, //, %, **',
    borderClass: 'border-amber-400 dark:border-amber-600',
  },
  random: {
    icon: '🎲',
    label: 'Случайное число',
    hint: 'Целое число от мин до макс',
    borderClass: 'border-green-400 dark:border-green-600',
  },
  random_item: {
    icon: '🎯',
    label: 'Случайный элемент',
    hint: 'Из списка через запятую',
    borderClass: 'border-emerald-400 dark:border-emerald-600',
  },
  timestamp: {
    icon: '⏱',
    label: 'Timestamp',
    hint: 'Unix время + смещение (сек)',
    borderClass: 'border-cyan-400 dark:border-cyan-600',
  },
  format_duration: {
    icon: '⏳',
    label: 'Длительность',
    hint: 'Секунды → MM:SS или HH:MM:SS',
    borderClass: 'border-orange-400 dark:border-orange-600',
  },
  format_number: {
    icon: '#',
    label: 'Формат числа',
    hint: 'Число с разделителями: 5000000 → 5 000 000',
    borderClass: 'border-violet-400 dark:border-violet-600',
  },
  array_item: {
    icon: '📋',
    label: 'Элемент массива',
    hint: 'По индексу или dot-notation ключу',
    borderClass: 'border-emerald-400 dark:border-emerald-600',
  },
  lookup: {
    icon: '🔍',
    label: 'Поиск в таблице',
    hint: 'Найти значение по условию',
    borderClass: 'border-blue-400 dark:border-blue-600',
  },
  str_replace: {
    icon: '✂️',
    label: 'Замена подстроки',
    hint: 'Найти и заменить в строке',
    borderClass: 'border-purple-400 dark:border-purple-600',
  },
};

/** Пропсы строки присваивания */
interface AssignmentRowProps {
  /** Данные присваивания */
  assignment: Assignment;
  /** Обработчик изменения поля */
  onChange: (id: string, field: string, val: any) => void;
  /** Обработчик удаления строки */
  onRemove: (id: string) => void;
  /** Можно ли удалить строку */
  canRemove: boolean;
  /** Доступные переменные для вставки */
  textVariables: Variable[];
}

/**
 * Строка одного присваивания переменной с dropdown-выбором режима
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
  const modeConfig = MODE_CONFIGS[assignment.mode] || MODE_CONFIGS.text;

  /**
   * Вставляет переменную в поле значения
   * @param varName - имя переменной
   */
  const handleInsertVariable = (varName: string) => {
    onChange(assignment.id, 'value', assignment.value + `{${varName}}`);
  };

  return (
    <div className="rounded-lg border border-border/60 bg-card/30 p-2.5 space-y-2">
      {/* Верхняя строка: переменная = ... */}
      <div className="flex items-center gap-1.5">
        {/* Имя переменной (слева) */}
        <div className="w-[180px] flex-shrink-0">
          <VariableNameInput
            value={assignment.variable}
            availableVariables={textVariables}
            onChange={(val) => onChange(assignment.id, 'variable', val)}
            placeholder="переменная"
          />
        </div>

        <span className="text-muted-foreground text-xs font-mono">=</span>

        {/* Значение (зависит от режима) */}
        <div className="flex-1 min-w-0">
          {renderValueInput(assignment, modeConfig, onChange, handleInsertVariable, textVariables)}
        </div>

        {/* Кнопка удаления */}
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(assignment.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Нижняя строка: выбор режима + подсказка */}
      <div className="flex items-center gap-2">
        <Select
          value={assignment.mode}
          onValueChange={(val) => onChange(assignment.id, 'mode', val)}
        >
          <SelectTrigger className="h-6 w-[160px] text-[11px] bg-muted/40 border-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(MODE_CONFIGS).map(([mode, cfg]) => (
              <SelectItem key={mode} value={mode} className="text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-4 text-center">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-[10px] text-muted-foreground truncate">
          {modeConfig.hint}
        </span>
      </div>

      {/* Условия lookup (если режим lookup) */}
      {assignment.mode === 'lookup' && (
        <LookupConditions
          assignment={assignment}
          onChange={onChange}
        />
      )}
    </div>
  );
}

/**
 * Рендерит поле ввода значения в зависимости от режима
 */
function renderValueInput(
  assignment: Assignment,
  modeConfig: ModeConfig,
  onChange: (id: string, field: string, val: any) => void,
  handleInsertVariable: (varName: string) => void,
  textVariables: Variable[],
) {
  const inputClass = `text-xs h-7 ${modeConfig.borderClass}`;

  switch (assignment.mode) {
    case 'random':
      return (
        <div className="flex items-center gap-1">
          <Input
            placeholder="мин"
            value={assignment.value || ''}
            onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <span className="text-muted-foreground text-[10px]">...</span>
          <Input
            placeholder="макс"
            value={assignment.maxValue || ''}
            onChange={(e) => onChange(assignment.id, 'maxValue', e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
        </div>
      );

    case 'array_item':
      return (
        <div className="flex items-center gap-1">
          <Input
            placeholder="{массив}"
            value={assignment.value || ''}
            onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <span className="text-muted-foreground text-[10px]">[</span>
          <Input
            placeholder="индекс или ключ"
            value={assignment.maxValue || ''}
            onChange={(e) => onChange(assignment.id, 'maxValue', e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <span className="text-muted-foreground text-[10px]">]</span>
        </div>
      );

    case 'str_replace':
      return (
        <div className="flex items-center gap-1">
          <Input
            placeholder="искать"
            value={assignment.value || ''}
            onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <span className="text-muted-foreground text-[10px]">→</span>
          <Input
            placeholder="заменить на"
            value={assignment.replaceWith || ''}
            onChange={(e) => onChange(assignment.id, 'replaceWith', e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
        </div>
      );

    case 'lookup':
      return (
        <div className="flex items-center gap-1">
          <Input
            placeholder="таблица"
            value={assignment.lookupTable || ''}
            onChange={(e) => onChange(assignment.id, 'lookupTable', e.target.value)}
            className={`w-[90px] ${inputClass}`}
          />
          <span className="text-muted-foreground text-[10px]">.</span>
          <Input
            placeholder="поле"
            value={assignment.lookupField || ''}
            onChange={(e) => onChange(assignment.id, 'lookupField', e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
        </div>
      );

    default:
      // text, expression, random_item, timestamp, format_duration
      return (
        <div className="flex items-center gap-1">
          <Input
            placeholder={getPlaceholder(assignment.mode)}
            value={assignment.value || ''}
            onChange={(e) => onChange(assignment.id, 'value', e.target.value)}
            className={`flex-1 ${inputClass}`}
          />
          <VariableSelector
            availableVariables={textVariables}
            onSelect={handleInsertVariable}
          />
        </div>
      );
  }
}

/**
 * Возвращает placeholder для поля ввода в зависимости от режима
 */
function getPlaceholder(mode: AssignmentMode): string {
  switch (mode) {
    case 'expression':
      return '{a} + {b} * 2';
    case 'random_item':
      return 'элемент1, элемент2, элемент3';
    case 'timestamp':
      return '0 = сейчас, 90 = +90 сек';
    case 'format_duration':
      return '{expires_at} - {now_ts}';
    default:
      return 'значение или {переменная}';
  }
}

/**
 * Блок условий для режима lookup
 */
function LookupConditions({
  assignment,
  onChange,
}: {
  assignment: Assignment;
  onChange: (id: string, field: string, val: any) => void;
}) {
  const conditions = assignment.lookupWhere || [];

  return (
    <div className="ml-3 pl-3 border-l-2 border-blue-200 dark:border-blue-800 space-y-1.5">
      <p className="text-[10px] text-blue-500 dark:text-blue-400 font-medium">
        WHERE:
      </p>
      {conditions.map((cond, idx) => (
        <div key={idx} className="flex items-center gap-1">
          <Input
            placeholder="поле"
            value={cond.field}
            onChange={(e) => {
              const updated = [...conditions];
              updated[idx] = { ...updated[idx], field: e.target.value };
              onChange(assignment.id, 'lookupWhere', updated);
            }}
            className="w-20 text-xs h-6"
          />
          <span className="text-muted-foreground text-[10px]">=</span>
          <Input
            placeholder="{переменная}"
            value={cond.value}
            onChange={(e) => {
              const updated = [...conditions];
              updated[idx] = { ...updated[idx], value: e.target.value };
              onChange(assignment.id, 'lookupWhere', updated);
            }}
            className="flex-1 text-xs h-6"
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 text-muted-foreground hover:text-destructive"
            onClick={() => {
              const updated = conditions.filter((_, i) => i !== idx);
              onChange(assignment.id, 'lookupWhere', updated);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-5 text-[10px] text-blue-500 px-1"
        onClick={() => {
          onChange(assignment.id, 'lookupWhere', [...conditions, { field: '', value: '' }]);
        }}
      >
        + условие
      </Button>
    </div>
  );
}
