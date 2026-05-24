import type { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const matchType: string = (selectedNode.data as any)?.textMatchType || 'exact';

  const handleTextChange = (value: string) => {
    onNodeUpdate(selectedNode.id, { textSynonyms: value ? [value] : [] });
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

      <div className="space-y-2">
        <Label>Режим совпадения</Label>
        <Select
          value={matchType}
          onValueChange={(v) => onNodeUpdate(selectedNode.id, { textMatchType: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="exact">Точное совпадение</SelectItem>
            <SelectItem value="contains">Содержит подстроку</SelectItem>
          </SelectContent>
        </Select>
        <div className="text-xs text-muted-foreground">
          {matchType === 'exact'
            ? 'Сообщение должно быть точно равно указанному тексту'
            : 'Сообщение должно содержать указанный текст (может быть частью фразы)'}
        </div>
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
