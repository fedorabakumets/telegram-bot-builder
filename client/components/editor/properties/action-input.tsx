/**
 * @fileoverview Компонент полей ввода для действий кнопки ответа
 * @description Отображает поле в зависимости от действия (goto/command/url).
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TargetNodeSelector } from './target-node-selector';
import { ResponseAction } from './response-action-config';

interface ActionInputProps {
  action: ResponseAction;
  option: { id: string; text: string; target?: string; url?: string; action: string; value?: string; };
  index: number;
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  selectedNode: Node;
  onOptionsUpdate: (updated: any[]) => void;
  formatNodeDisplay: (node: Node, sheetName: string) => string;
}

/**
 * Компонент полей ввода для действий
 */
export function ActionInput({
  action, option, index, getAllNodesFromAllSheets, selectedNode, onOptionsUpdate, formatNodeDisplay
}: ActionInputProps) {
  const update = (updates: any) => {
    const updated = [...(selectedNode.data.responseOptions || [])];
    updated[index] = { ...option, ...updates };
    onOptionsUpdate(updated);
  };

  if (action === 'goto') {
    return (
      <TargetNodeSelector option={option} index={index} getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        selectedNode={selectedNode} onOptionsUpdate={onOptionsUpdate} formatNodeDisplay={formatNodeDisplay} />
    );
  }

  if (action === 'command') {
    return (
      <div>
        <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">Команда для выполнения</Label>
        <Input value={option.target || ''} onChange={(e) => update({ target: e.target.value })}
          className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
          placeholder="например: /start, /help, /menu" />
      </div>
    );
  }

  if (action === 'url') {
    return (
      <div>
        <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">Ссылка для открытия</Label>
        <Input value={option.url || ''} onChange={(e) => update({ url: e.target.value })}
          className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
          placeholder="https://example.com" />
      </div>
    );
  }

  return null;
}
