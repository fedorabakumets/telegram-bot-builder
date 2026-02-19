/**
 * @fileoverview Компонент списка кнопок для условного сообщения
 * @description Отображает список кнопок с возможностью добавления/удаления.
 */

import { Node } from '@shared/schema';
import { Button as UIButton } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ConditionalButton } from './conditional-button';

interface ConditionalButtonsListProps {
  condition: any;
  selectedNode: Node;
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  textVariables: any[];
  SYSTEM_VARIABLES: any[];
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

export function ConditionalButtonsList({
  condition, selectedNode, getAllNodesFromAllSheets, formatNodeDisplay,
  textVariables, SYSTEM_VARIABLES, onNodeUpdate
}: ConditionalButtonsListProps) {
  const add_button = () => {
    const conditions = selectedNode.data.conditionalMessages || [];
    const newButton = { id: Date.now().toString(), text: 'Новая кнопка', action: 'goto', target: '' };
    onNodeUpdate(selectedNode.id, {
      conditionalMessages: conditions.map((c: any) => c.id === condition.id
        ? { ...c, buttons: [...(c.buttons || []), newButton] } : c)
    });
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-foreground">Кнопки</Label>
        <UIButton size="sm" variant="outline" onClick={add_button} className="text-xs">
          <i className="fas fa-plus mr-1.5"></i>Добавить
        </UIButton>
      </div>
      {(condition.buttons || []).map((button: any, i: number) => (
        <ConditionalButton key={button.id} button={button} buttonIndex={i} condition={condition}
          selectedNode={selectedNode} getAllNodesFromAllSheets={getAllNodesFromAllSheets}
          formatNodeDisplay={formatNodeDisplay} textVariables={textVariables}
          SYSTEM_VARIABLES={SYSTEM_VARIABLES} onNodeUpdate={onNodeUpdate} />
      ))}
    </div>
  );
}
