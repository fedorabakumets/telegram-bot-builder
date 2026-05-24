/**
 * @fileoverview Превью узла set_variable на канвасе
 *
 * Отображает список присваиваний с режимом и ключевыми деталями.
 * Формат: переменная = значение [режим-бейдж]
 * Для regex_extract дополнительно показывает паттерн.
 * Максимум 3 строки, остальные за "+N".
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
  /** Регулярное выражение (mode=regex_extract) */
  pattern?: string;
}

/**
 * Маппинг режимов в компактные бейджи для канваса.
 * text — дефолт, не показывается.
 */
const MODE_LABELS: Record<string, string> = {
  expression: '📐 выражение',
  random: '🎲 random',
  random_item: '🎲 из списка',
  array_item: '📋 элемент',
  timestamp: '⏱ timestamp',
  format_duration: '⏱ MM:SS',
  format_number: '#️⃣ число',
  regex_extract: '🔍 regex',
  extract_number: '🔢 число',
  split_get: '✂️ split',
  json_get: '📦 json',
  substring: '✂️ substr',
  conditional: '❓ если',
  lowercase: '⬇️ lower',
  uppercase: '⬆️ upper',
  trim: '🧹 trim',
  length: '📏 length',
  lookup: '🔎 lookup',
  str_replace: '🔄 replace',
  json_push: '➕ push',
  json_format: '📝 format',
};

/** Пропсы компонента SetVariablePreview */
interface SetVariablePreviewProps {
  /** Узел типа set_variable */
  node: Node;
}

/** Максимум видимых присваиваний */
const MAX_VISIBLE = 3;

/**
 * Превью узла set_variable на канвасе.
 * Показывает переменную = значение с бейджем режима.
 * @param props - Свойства компонента
 * @returns JSX-элемент превью
 */
export function SetVariablePreview({ node }: SetVariablePreviewProps) {
  const assignments: Assignment[] = (node.data as any)?.assignments || [];

  if (assignments.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">Нет переменных</span>
    );
  }

  const visible = assignments.slice(0, MAX_VISIBLE);
  const hidden = assignments.length - visible.length;

  return (
    <div className="flex flex-col gap-1 w-full">
      {visible.map((a) => (
        <AssignmentRow key={a.id} assignment={a} />
      ))}
      {hidden > 0 && (
        <span className="text-[10px] text-slate-500">
          +{hidden} ещё
        </span>
      )}
    </div>
  );
}

/**
 * Строка одного присваивания с режимом и деталями
 * @param props - Присваивание
 * @returns JSX-элемент строки
 */
function AssignmentRow({ assignment: a }: { assignment: Assignment }) {
  const mode = a.mode || 'text';
  const modeLabel = MODE_LABELS[mode] || null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 leading-tight">
        <span className="font-mono text-[11px] text-emerald-400 truncate max-w-[90px]">
          {a.variable || '…'}
        </span>
        <span className="text-[11px] text-slate-500 flex-shrink-0">=</span>
        <span className="font-mono text-[11px] text-slate-300 truncate max-w-[110px]">
          {a.value || '""'}
        </span>
        {modeLabel && (
          <span className="text-[9px] text-slate-500 flex-shrink-0 ml-0.5">
            {modeLabel}
          </span>
        )}
      </div>
      {mode === 'regex_extract' && a.pattern && (
        <span className="font-mono text-[9px] text-purple-400/70 pl-2 truncate max-w-[200px]">
          🔍 regex: {a.pattern}
        </span>
      )}
    </div>
  );
}
