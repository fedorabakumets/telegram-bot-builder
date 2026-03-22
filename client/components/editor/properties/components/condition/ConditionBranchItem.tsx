/**
 * @fileoverview Компонент одной ветки узла условия в панели свойств.
 * Для ветки else отображает статичный текст "Иначе" вместо поля лейбла.
 * Содержит поле редактирования текста сообщения связанного message-узла.
 */
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { Node } from '@shared/schema';
import type { ConditionBranch, ConditionOperator } from '@shared/types/condition-node';

interface ConditionBranchItemProps {
  /** Ветка условия */
  branch: ConditionBranch;
  /** Связанный message-узел для этой ветки (null для ветки else) */
  messageNode: Node | null;
  /** Обработчик изменения поля ветки */
  onChange: (id: string, field: keyof ConditionBranch, value: string) => void;
  /** Обработчик удаления ветки */
  onDelete: (id: string) => void;
  /** Обработчик обновления данных узла (для message-узла) */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
}

/** Метки операторов для отображения в выпадающем списке */
const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  'filled': 'заполнено',
  'empty': 'не заполнено',
  'equals': 'равно',
  'else': 'во всех остальных случаях',
};

/** Операторы, доступные для выбора пользователем */
const SELECTABLE_OPERATORS: ConditionOperator[] = ['filled', 'empty', 'equals'];

/**
 * Компонент отдельной ветки условия.
 * Для ветки else показывает статичный текст "Иначе".
 * Для остальных веток отображает выбор оператора, поле значения и текст сообщения.
 */
export function ConditionBranchItem({ branch, messageNode, onChange, onDelete, onNodeUpdate }: ConditionBranchItemProps) {
  const isElse = branch.operator === 'else';
  const needsValue = branch.operator === 'equals';
  const messageText: string = (messageNode?.data as any)?.messageText ?? '';

  /** Обновляет текст сообщения в связанном message-узле */
  const handleMessageTextChange = (value: string) => {
    if (!messageNode) return;
    onNodeUpdate(messageNode.id, { messageText: value });
  };

  return (
    <div className={`rounded-lg border p-3 space-y-2 ${isElse ? 'border-gray-200 bg-gray-50 dark:bg-slate-800/40 dark:border-slate-700' : 'border-violet-200 bg-violet-50/50 dark:bg-violet-900/10 dark:border-violet-800/40'}`}>
      {/* Заголовок ветки: статичный текст для else, иначе — выбор оператора */}
      {isElse ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Иначе</p>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={branch.operator}
            onChange={e => onChange(branch.id, 'operator', e.target.value)}
            className="text-xs rounded-md border border-input bg-background px-2 py-1 h-7 focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {SELECTABLE_OPERATORS.map(op => (
              <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
            ))}
          </select>
          {needsValue && (
            <Input
              value={branch.value}
              onChange={e => onChange(branch.id, 'value', e.target.value)}
              placeholder="введите значение"
              className="text-sm h-7 flex-1"
            />
          )}
        </div>
      )}

      {/* Поле ID целевого узла для перехода */}
      <div className="space-y-1">
        <Input
          value={branch.target || ''}
          onChange={e => onChange(branch.id, 'target', e.target.value)}
          placeholder="ID узла для перехода"
          className="text-xs font-mono h-7"
        />
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Укажите ID узла или перетащите соединение
        </p>
      </div>

      {/* Текст сообщения ветки — редактирует связанный message-узел */}
      {messageNode && (
        <div className="space-y-1">
          <Textarea
            value={messageText}
            onChange={e => handleMessageTextChange(e.target.value)}
            placeholder="Текст сообщения для этой ветки..."
            className="text-xs min-h-[60px] resize-none"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Текст сообщения, отправляемого по этой ветке
          </p>
        </div>
      )}
    </div>
  );
}
