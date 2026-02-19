/**
 * @fileoverview Компонент конфигурации клавиатуры для условного сообщения
 */

import { Label } from '@/components/ui/label';
import { Button as UIButton } from '@/components/ui/button';
import { ConditionalButtonsList } from './conditional-buttons-list';
import { KeyboardTypeToggles } from './keyboard-type-toggles';
import { ReplyKeyboardSettings } from './reply-keyboard-settings';

interface ConditionalKeyboardConfigProps {
  condition: any;
  selectedNode: any;
  getAllNodesFromAllSheets: Array<{ node: any; sheetName: string }>;
  formatNodeDisplay: (node: any, sheetName: string) => string;
  textVariables: any[];
  SYSTEM_VARIABLES: any[];
  onNodeUpdate: (nodeId: string, updates: any) => void;
}

const updateCondition = (condition: any, selectedNode: any, updates: any, onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, { conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, ...updates } : c) });
};

/**
 * Компонент конфигурации клавиатуры для условного сообщения
 */
export function ConditionalKeyboardConfig({
  condition,
  selectedNode,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables,
  SYSTEM_VARIABLES,
  onNodeUpdate
}: ConditionalKeyboardConfigProps) {
  const keyboardType = (condition as any).keyboardType || 'none';

  const handleAddButton = () => {
    const newButton = {
      id: Date.now().toString(),
      text: 'Новая кнопка',
      action: 'goto',
      target: '',
      url: '',
      buttonType: 'normal',
      skipDataCollection: false,
      hideAfterClick: false
    };
    updateCondition(condition, selectedNode, { buttons: [...(condition.buttons || []), newButton] }, onNodeUpdate);
  };

  return (
    <div className="space-y-3 border-t border-purple-200/30 dark:border-purple-800/30 pt-4">
      <div className="flex flex-col gap-3">
        <Label className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide">
          <i className="fas fa-keyboard mr-1.5"></i>Кнопки для условного сообщения
        </Label>
        <KeyboardTypeToggles keyboardType={keyboardType} onKeyboardTypeChange={(v) => updateCondition(condition, selectedNode, { keyboardType: v }, onNodeUpdate)} />
      </div>

      {keyboardType && keyboardType !== 'none' && (
        <div className="space-y-4">
          <div className="border-t border-purple-200/20 dark:border-purple-800/20 pt-4"></div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
              <span className="text-sm font-semibold text-purple-700 dark:text-purple-300 uppercase truncate">Кнопки ({(condition.buttons || []).length})</span>
            </div>
            <UIButton size="sm" variant="default" onClick={handleAddButton} title="Добавить кнопку"
              className="text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 h-8 flex-shrink-0">
              <i className="fas fa-plus"></i><span className="hidden sm:inline ml-1.5">Добавить кнопку</span>
            </UIButton>
          </div>
          <ConditionalButtonsList condition={condition} selectedNode={selectedNode} getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            formatNodeDisplay={formatNodeDisplay} textVariables={textVariables} SYSTEM_VARIABLES={SYSTEM_VARIABLES} onNodeUpdate={onNodeUpdate} />
          {keyboardType === 'reply' && <ReplyKeyboardSettings condition={condition} onNodeUpdate={onNodeUpdate} />}
        </div>
      )}
    </div>
  );
}
