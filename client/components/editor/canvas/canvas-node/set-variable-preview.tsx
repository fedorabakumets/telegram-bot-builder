/**
 * @fileoverview Превью узла переменных на холсте
 *
 * Отображает список присваиваний в формате: переменная = значение
 * с иконкой режима. Показывает до 4 строк, остальные за счётчиком.
 *
 * @module components/editor/canvas/canvas-node/set-variable-preview
 */

import { Node } from '@/types/bot';

/** Одно присваивание переменной */
interface Assignment {
  /** Уникальный идентификатор */
  id: string;
  /** Имя переменной */
  variable: string;
  /** Значение или шаблон */
  value: string;
  /** Режим присваивания */
  mode?: string;
}

/** Иконки режимов для канваса */
const MODE_ICONS: Record<string, string> = {
  text: 'T',
  expression: '=',
  random: '🎲',
  random_item: '🎯',
  timestamp: '⏱',
  format_duration: '⏳',
  array_item: '[]',
  lookup: '🔍',
  str_replace: '✂️',
};

/** Пропсы компонента SetVariablePreview */
interface SetVariablePreviewProps {
  /** Узел типа set_variable */
  node: Node;
}

/**
 * Превью узла переменных на канвасе
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function SetVariablePreview({ node }: SetVariablePreviewProps) {
  const assignments: Assignment[] = (node.data as any)?.assignments || [];

  /** Показываем максимум 4 присваивания */
  const visible = assignments.slice(0, 4);
  const hidden = assignments.length - visible.length;

  if (assignments.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">Нет переменных</span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5 w-full">
      {visible.map((a) => (
        <div key={a.id} className="flex items-center gap-1 text-[11px] leading-tight">
          <code className="text-emerald-300 font-mono truncate max-w-[100px]">
            {a.variable || '…'}
          </code>
          <span className="text-slate-500 flex-shrink-0">
            {MODE_ICONS[a.mode || 'text'] === '=' ? '=' : '←'}
          </span>
          <span className="text-slate-400 truncate max-w-[120px] font-mono">
            {formatValue(a)}
          </span>
        </div>
      ))}
      {hidden > 0 && (
        <span className="text-[10px] text-slate-500 mt-0.5">
          +{hidden} ещё
        </span>
      )}
    </div>
  );
}

/**
 * Форматирует значение для отображения на канвасе
 * @param a - присваивание
 * @returns отформатированная строка
 */
function formatValue(a: Assignment): string {
  switch (a.mode) {
    case 'expression':
      return a.value || '0';
    case 'random':
      return `rand(${a.value || '?'}…${(a as any).maxValue || '?'})`;
    case 'random_item':
      return a.value ? a.value.split(',').length + ' вар.' : '…';
    case 'timestamp':
      return a.value === '0' ? 'now()' : `now()+${a.value}s`;
    case 'format_duration':
      return 'MM:SS';
    case 'lookup':
      return `${(a as any).lookupTable || '?'}.${(a as any).lookupField || '?'}`;
    case 'str_replace':
      return `replace(…)`;
    case 'array_item':
      return `${a.value || '?'}[${(a as any).maxValue || '0'}]`;
    default:
      return a.value || '""';
  }
}
