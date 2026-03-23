/**
 * @fileoverview Компонент одной ветки узла условия в панели свойств.
 * Для ветки else отображает статичный текст "Иначе" вместо поля лейбла.
 * Содержит поле редактирования текста сообщения связанного message-узла.
 */
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Node } from '@shared/schema';
import type { ConditionBranch, ConditionOperator } from '@shared/types/condition-node';
import { formatNodeDisplay } from '../../utils/node-formatters';

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
  /** Все узлы из всех листов для выбора цели перехода */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
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
export function ConditionBranchItem({ branch, messageNode, onChange, onDelete, onNodeUpdate, getAllNodesFromAllSheets }: ConditionBranchItemProps) {
  const isElse = branch.operator === 'else';
  const needsValue = branch.operator === 'equals';
  const messageText: string = (messageNode?.data as any)?.messageText ?? '';
  const EXCLUDED_TYPES = new Set(['command_trigger', 'text_trigger', 'condition']);
  const availableTargets = getAllNodesFromAllSheets.filter(({ node }) => !EXCLUDED_TYPES.has(node.type));

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
          <Select
            value={branch.operator}
            onValueChange={(value) => onChange(branch.id, 'operator', value)}
          >
            <SelectTrigger className="text-xs h-7 bg-white/60 dark:bg-slate-950/60 border border-violet-300/40 dark:border-violet-700/40 hover:border-violet-400/60 focus:border-violet-500 focus:ring-2 focus:ring-violet-400/30 rounded-md text-violet-900 dark:text-violet-50 w-auto min-w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gradient-to-br from-violet-50/95 to-purple-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-violet-200/50 dark:border-violet-800/50 shadow-xl">
              {SELECTABLE_OPERATORS.map(op => (
                <SelectItem key={op} value={op}>
                  <span className="text-xs text-violet-700 dark:text-violet-300">{OPERATOR_LABELS[op]}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        <Select
          value={branch.target || ''}
          onValueChange={(value) => onChange(branch.id, 'target', value)}
        >
          <SelectTrigger className="w-full text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-sky-300/40 dark:border-sky-700/40 hover:border-sky-400/60 dark:hover:border-sky-600/60 hover:bg-white/80 dark:hover:bg-slate-900/60 focus:border-sky-500 dark:focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30 dark:focus:ring-sky-600/30 transition-all duration-200 rounded-lg text-sky-900 dark:text-sky-50">
            <SelectValue placeholder="⊘ Не выбрано" />
          </SelectTrigger>
          <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 border border-sky-200/50 dark:border-sky-800/50 shadow-xl max-h-48 overflow-y-auto">
            {availableTargets.map(({ node, sheetName }) => (
              <SelectItem key={node.id} value={node.id}>
                <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate">
                  {formatNodeDisplay(node, sheetName)}
                </span>
              </SelectItem>
            ))}
            {availableTargets.length === 0 && (
              <SelectItem value="no-nodes" disabled>
                <span className="text-muted-foreground text-xs">Нет доступных узлов</span>
              </SelectItem>
            )}
          </SelectContent>
        </Select>
        <Input
          value={branch.target || ''}
          onChange={e => onChange(branch.id, 'target', e.target.value)}
          className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-sky-300/40 dark:border-sky-700/40 text-sky-900 dark:text-sky-50 placeholder:text-sky-500/50 dark:placeholder:text-sky-400/50 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30"
          placeholder="Или введите ID узла вручную"
        />
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
