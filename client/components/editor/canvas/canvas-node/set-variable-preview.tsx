/**
 * @fileoverview Превью узла установки переменных на холсте
 *
 * Отображает список присваиваний переменных в компактном виде.
 * Показывает первые 3 пары variable → value, остальные скрывает за счётчиком.
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
}

/** Пропсы компонента SetVariablePreview */
interface SetVariablePreviewProps {
  /** Узел типа set_variable */
  node: Node;
}

/**
 * Превью узла установки переменных
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент превью
 */
export function SetVariablePreview({ node }: SetVariablePreviewProps) {
  const assignments: Assignment[] = (node.data as any)?.assignments || [];

  /** Показываем максимум 3 присваивания */
  const visible = assignments.slice(0, 3);
  const hidden = assignments.length - visible.length;

  if (assignments.length === 0) {
    return (
      <span className="text-xs text-slate-400 italic">Нет переменных</span>
    );
  }

  return (
    <div className="flex flex-col gap-1 w-full">
      {visible.map((a) => (
        <div key={a.id} className="flex items-center gap-1 text-xs">
          <code className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono text-xs truncate max-w-[80px]">
            {a.variable || '…'}
          </code>
          <span className="text-slate-500">←</span>
          <span className="text-slate-300 truncate max-w-[80px]">
            {a.value || '""'}
          </span>
        </div>
      ))}
      {hidden > 0 && (
        <span className="text-xs text-slate-500">+{hidden} ещё</span>
      )}
    </div>
  );
}
