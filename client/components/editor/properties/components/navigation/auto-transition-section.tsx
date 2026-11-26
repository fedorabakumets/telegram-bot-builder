/** @fileoverview Выбор следующего блока по тем же полям, которые использует холст. */
import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNodeDisplay } from '../../utils/node-formatters';

interface TransitionProps {
  /** Редактируемый блок. */
  selectedNode: Node;
  /** Блоки проекта вместе с названиями листов. */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName?: string }>;
  /** Сохраняет изменения блока. */
  onNodeUpdate: (id: string, updates: Partial<Node['data']>) => void;
  /** Переход выполняется после получения ответа. */
  afterAnswer?: boolean;
}

/**
 * Показывает назначение стрелки и позволяет изменить или убрать его.
 * @param props - Блок, доступные цели и обработчик обновления.
 * @returns Поле выбора назначения.
 */
export function AutoTransitionSection({ selectedNode, getAllNodesFromAllSheets, onNodeUpdate, afterAnswer }: TransitionProps) {
  const { data } = selectedNode;
  const target = afterAnswer
    ? data.inputTargetNodeId || (selectedNode.type === 'input' ? data.autoTransitionTo : '')
    : data.enableAutoTransition ? data.autoTransitionTo : '';
  const label = afterAnswer ? 'После ответа перейти к' : 'Следующий блок';
  return <NextBlockSelect selectedNode={selectedNode} getAllNodesFromAllSheets={getAllNodesFromAllSheets}
    target={target} label={label} onChange={(id) => onNodeUpdate(selectedNode.id, afterAnswer
      ? { inputTargetNodeId: id, ...(selectedNode.type === 'input' ? { autoTransitionTo: '', enableAutoTransition: false } : {}) }
      : { autoTransitionTo: id, enableAutoTransition: Boolean(id) })} />;
}

interface NextBlockProps extends Pick<TransitionProps, 'selectedNode' | 'getAllNodesFromAllSheets'> {
  /** Цель сохранённой связи. */
  target?: string;
  /** Подпись поля. */
  label: string;
  /** Обновляет назначение связи. */
  onChange: (id: string) => void;
  /** Форматирует название блока проекта. */
  display?: typeof formatNodeDisplay;
}

/**
 * Отображает общий список назначений для переходов и триггеров.
 * @param props - Назначение связи и доступные блоки.
 * @returns Поле выбора блока.
 */
export function NextBlockSelect({ selectedNode, getAllNodesFromAllSheets, target, label, onChange, display = formatNodeDisplay }: NextBlockProps) {
  const fieldId = `transition-${selectedNode.id}`;
  return (
    <div className="min-w-0 space-y-1.5 py-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <Select value={target ? `node:${target}` : 'none'} onValueChange={(choice) => onChange(choice === 'none' ? '' : choice.slice(5))}>
        <SelectTrigger id={fieldId} className="w-full min-w-0 [&>span]:truncate"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Без перехода</SelectItem>
          {getAllNodesFromAllSheets.filter(({ node }) => node.id !== selectedNode.id).map(({ node, sheetName }) => (
            <SelectItem key={node.id} value={`node:${node.id}`}>{display(node, sheetName || 'Лист 1')}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}