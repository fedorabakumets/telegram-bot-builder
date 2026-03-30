import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNodeDisplay as defaultFormatNodeDisplay, getNodeTypeLabel } from '../../utils/node-formatters';

interface TriggerTargetSelectorProps {
  selectedNode: Node;
  autoTransitionTo?: string;
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

export function TriggerTargetSelector({
  selectedNode,
  autoTransitionTo,
  getAllNodesFromAllSheets = [],
  onNodeUpdate,
  formatNodeDisplay = defaultFormatNodeDisplay,
}: TriggerTargetSelectorProps) {
  const availableNodes = getAllNodesFromAllSheets.filter(({ node }) => node.id !== selectedNode.id);
  const selectedTarget = availableNodes.find(({ node }) => node.id === (autoTransitionTo || ''));

  return (
    <div className="space-y-2">
      <Label>Следующий узел</Label>
      <Select
        value={autoTransitionTo || ''}
        onValueChange={(value) => onNodeUpdate(selectedNode.id, { autoTransitionTo: value })}
      >
        <SelectTrigger className="text-sm bg-white/70 dark:bg-slate-950/60 border border-sky-300/40 dark:border-sky-700/40 hover:border-sky-400/60 dark:hover:border-sky-600/60 focus:border-sky-500 focus:ring-2 focus:ring-sky-400/30 rounded-lg text-sky-900 dark:text-sky-50">
          <SelectValue placeholder="Не выбрано">
            {selectedTarget ? getNodeTypeLabel(selectedTarget.node.type) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gradient-to-br from-sky-50/95 to-blue-50/90 dark:from-slate-900/95 dark:to-slate-800/95 max-h-48 overflow-y-auto">
          {availableNodes.map(({ node, sheetId, sheetName }) => (
            <SelectItem key={`${sheetId || 'sheet'}-${node.id}`} value={node.id}>
              <span className="text-xs font-mono text-sky-700 dark:text-sky-300 truncate">
                {formatNodeDisplay(node, sheetName || 'Лист 1')}
              </span>
            </SelectItem>
          ))}
          {availableNodes.length === 0 && (
            <SelectItem value="no-nodes" disabled>
              Создайте другие узлы
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <Input
        value={autoTransitionTo || ''}
        onChange={(e) => onNodeUpdate(selectedNode.id, { autoTransitionTo: e.target.value })}
        placeholder="Или введите ID узла вручную"
        className="font-mono"
      />
    </div>
  );
}
