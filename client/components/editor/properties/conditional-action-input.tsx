/**
 * @fileoverview Компонент полей ввода для действия кнопки условного сообщения
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConditionalButtonAction } from './conditional-button-config';

interface ConditionalActionInputProps {
  action: ConditionalButtonAction;
  button: any;
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  selectedNode: Node;
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  onUpdate: (updates: any) => void;
}

export function ConditionalActionInput({
  action, button, getAllNodesFromAllSheets, selectedNode, formatNodeDisplay, onUpdate
}: ConditionalActionInputProps) {
  if (action === 'goto') {
    return (
      <Select value={button.target || ''} onValueChange={onUpdate}>
        <SelectTrigger className="h-9 text-sm bg-white/60 dark:bg-slate-950/60 border border-sky-300/40 dark:border-sky-700/40 hover:border-sky-400/60 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30 rounded-lg text-sky-900 dark:text-sky-50">
          <SelectValue placeholder="⊘ Не выбрано" />
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
          {getAllNodesFromAllSheets.filter(n => n.node.id !== selectedNode.id).map(({ node, sheetName }) => (
            <SelectItem key={node.id} value={node.id}>
              <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate">{formatNodeDisplay(node, sheetName)}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (action === 'url') {
    return <Input value={button.url || ''} onChange={(e) => onUpdate({ url: e.target.value })} className="h-9 text-sm" placeholder="https://example.com" />;
  }

  if (action === 'command') {
    return <Input value={button.target || ''} onChange={(e) => onUpdate({ target: e.target.value })} className="h-9 text-sm" placeholder="/help" />;
  }

  return null;
}
