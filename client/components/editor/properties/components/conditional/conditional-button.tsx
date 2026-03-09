/**
 * @fileoverview Компонент кнопки для условного сообщения
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button as UIButton } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ConditionalActionSelector } from './conditional-action-selector';
import { ConditionalActionInput } from './conditional-action-input';
import { ConditionalVariableDropdown } from './conditional-variable-dropdown';
import { ConditionalButtonAction } from './conditional-button-config';

interface ConditionalButtonProps {
  button: any; buttonIndex: number; condition: any; selectedNode: Node;
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  textVariables: any[]; SYSTEM_VARIABLES: any[];
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

const updateButtons = (condition: any, selectedNode: Node, i: number, updates: any, fn: any) => {
  const c = selectedNode.data.conditionalMessages || [];
  fn(selectedNode.id, { conditionalMessages: c.map((x: any) => x.id === condition.id
    ? { ...x, buttons: (x.buttons || []).map((b: any, j: number) => j === i ? { ...b, ...updates } : b) } : x) });
};

export function ConditionalButton({
  button, buttonIndex, condition, selectedNode, getAllNodesFromAllSheets,
  formatNodeDisplay, textVariables, SYSTEM_VARIABLES, onNodeUpdate
}: ConditionalButtonProps) {
  const upd = (u: any) => updateButtons(condition, selectedNode, buttonIndex, u, onNodeUpdate);
  const rm = () => {
    const c = selectedNode.data.conditionalMessages || [];
    onNodeUpdate(selectedNode.id, { conditionalMessages: c.map((x: any) => x.id === condition.id
      ? { ...x, buttons: (x.buttons || []).filter((_: any, j: number) => j !== buttonIndex) } : x) });
  };

  return (
    <div className="bg-white dark:bg-gray-900/50 rounded-lg p-3 border border-purple-200/50 dark:border-purple-800/50 shadow-sm hover:border-purple-300 dark:hover:border-purple-700 transition-all">
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-purple-100/30 dark:border-purple-800/20">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-1 rounded-full bg-purple-500"></div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">Кнопка {buttonIndex + 1}</span>
          </div>
          <UIButton size="sm" variant="ghost" onClick={rm} className="h-6 text-destructive flex-shrink-0"><i className="fas fa-trash text-xs"></i></UIButton>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label className="text-xs font-medium text-foreground">Текст</Label>
            <ConditionalVariableDropdown textVariables={textVariables} SYSTEM_VARIABLES={SYSTEM_VARIABLES} onInsert={(t) => upd({ text: (button.text || '') + t })} />
          </div>
          <Input value={button.text} onChange={(e) => upd({ text: e.target.value })} className="h-9 text-sm" placeholder="Текст кнопки" />
          <div className="text-xs text-muted-foreground">{`Переменные: {age} → "25"`}</div>
        </div>
        <div className="space-y-2 border-t border-purple-100/30 dark:border-purple-800/20 pt-2.5">
          <ConditionalActionSelector action={button.action as ConditionalButtonAction} onActionChange={(a) => upd({ action: a })} />
          <ConditionalActionInput action={button.action as ConditionalButtonAction} button={button} getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            selectedNode={selectedNode} formatNodeDisplay={formatNodeDisplay} onUpdate={upd} />
        </div>
        {(condition.waitForTextInput || condition.collectUserInput || selectedNode.data.collectUserInput) && (
          <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-50/40 to-blue-50/30 dark:from-cyan-950/20 dark:to-blue-950/10 border border-cyan-200/40 dark:border-cyan-800/30">
            <div className="flex items-center gap-2.5 justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-cyan-200/50 dark:bg-cyan-900/40"><i className="fas fa-forward text-xs text-cyan-600 dark:text-cyan-400"></i></div>
                <div className="min-w-0 flex-1">
                  <Label className="text-xs font-semibold text-cyan-900 dark:text-cyan-100 cursor-pointer block">Пропустить сохранение</Label>
                  <div className="text-xs text-cyan-700/70 dark:text-cyan-300/70">Перейти без сохранения</div>
                </div>
              </div>
              <Switch checked={button.skipDataCollection ?? false} onCheckedChange={(v) => upd({ skipDataCollection: v })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
