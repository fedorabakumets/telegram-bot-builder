/**
 * @fileoverview Компонент одной ветки узла условия в панели свойств
 *
 * Отображает поля редактирования для одной ветки:
 * лейбл, оператор, значение и кнопку удаления.
 * Ветка "Иначе" (operator === "else") не удаляется и не имеет поля значения.
 *
 * @module components/editor/properties/components/condition/ConditionBranchItem
 */

import { Input } from '@/components/ui/input';
import type { ConditionBranch, ConditionOperator } from '@shared/types/condition-node';

/**
 * Пропсы компонента ConditionBranchItem
 */
interface ConditionBranchItemProps {
  /** Данные ветки */
  branch: ConditionBranch;
  /** Обработчик изменения поля ветки */
  onChange: (id: string, field: keyof ConditionBranch, value: string) => void;
  /** Обработчик удаления ветки */
  onDelete: (id: string) => void;
}

/** Метки операторов для отображения в селекте */
const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  '==': 'равно',
  '!=': 'не равно',
  'contains': 'содержит',
  'else': 'иначе',
};

/**
 * Компонент редактирования одной ветки условия
 *
 * @param props - Пропсы компонента
 * @returns JSX-элемент ветки
 */
export function ConditionBranchItem({ branch, onChange, onDelete }: ConditionBranchItemProps) {
  const isElse = branch.operator === 'else';

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${isElse ? 'border-gray-200 bg-gray-50 dark:bg-slate-800/40 dark:border-slate-700' : 'border-violet-200 bg-violet-50/50 dark:bg-violet-900/10 dark:border-violet-800/40'}`}>
      {/* Лейбл ветки */}
      <div className="flex items-center gap-2">
        <Input
          value={branch.label}
          onChange={e => onChange(branch.id, 'label', e.target.value)}
          placeholder="Название ветки"
          className="text-sm h-7"
        />
        {!isElse && (
          <button
            type="button"
            onClick={() => onDelete(branch.id)}
            className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
            aria-label="Удалить ветку"
          >
            <i className="fas fa-trash text-xs" />
          </button>
        )}
      </div>

      {/* Оператор и значение — только для не-else веток */}
      {!isElse && (
        <div className="flex items-center gap-2">
          <select
            value={branch.operator}
            onChange={e => onChange(branch.id, 'operator', e.target.value)}
            className="text-xs rounded-md border border-input bg-background px-2 py-1 h-7 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {(['==', '!=', 'contains'] as ConditionOperator[]).map(op => (
              <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
            ))}
          </select>
          <Input
            value={branch.value}
            onChange={e => onChange(branch.id, 'value', e.target.value)}
            placeholder="Значение"
            className="text-sm h-7 flex-1"
          />
        </div>
      )}
    </div>
  );
}
