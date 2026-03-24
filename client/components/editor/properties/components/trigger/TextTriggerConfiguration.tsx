import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TriggerTargetSelector } from './TriggerTargetSelector';
import { formatNodeDisplay as defaultFormatNodeDisplay } from '../../utils/node-formatters';

interface TextTriggerConfigurationProps {
  selectedNode: Node;
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  getAllNodesFromAllSheets?: Array<{ node: Node; sheetId?: string; sheetName?: string }>;
  formatNodeDisplay?: (node: Node, sheetName?: string) => string;
}

export function TextTriggerConfiguration({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay = defaultFormatNodeDisplay,
}: TextTriggerConfigurationProps) {
  const texts: string[] = (selectedNode.data as any)?.textSynonyms || [];
  const textValue = texts[0] || '';

  const handleTextChange = (value: string) => {
    const trimmed = value.trim();
    onNodeUpdate(selectedNode.id, { textSynonyms: trimmed ? [trimmed] : [] });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>Текст для срабатывания</Label>
        <Input
          value={textValue}
          onChange={e => handleTextChange(e.target.value)}
          placeholder="Введите текст"
        />
      </div>

      <TriggerTargetSelector
        selectedNode={selectedNode}
        autoTransitionTo={selectedNode.data?.autoTransitionTo || ''}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        formatNodeDisplay={formatNodeDisplay}
      />
    </div>
  );
}
