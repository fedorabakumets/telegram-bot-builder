/**
 * @fileoverview Компонент секции сбора ответов для условного сообщения
 * @description Отображает переключатель сбора ответов и связанные настройки.
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ConditionalMediaToggles } from './conditional-media-toggles';
import { ConditionalVariableInputs } from './conditional-variable-inputs';
import { ConditionalTransition } from './conditional-transition';

interface ConditionalCollectionSectionProps {
  condition: any;
  selectedNode: any;
  getAllNodesFromAllSheets: Array<{ node: any; sheetName: string }>;
  onNodeUpdate: (nodeId: string, updates: any) => void;
}

const updateCondition = (condition: any, selectedNode: any, updates: any, onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, {
    conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, ...updates } : c)
  });
};

/**
 * Компонент секции сбора ответов для условного сообщения
 */
export function ConditionalCollectionSection({
  condition,
  selectedNode,
  getAllNodesFromAllSheets,
  onNodeUpdate
}: ConditionalCollectionSectionProps) {
  return (
    <div className="border border-blue-200/50 dark:border-blue-800/50 rounded-xl p-3 sm:p-4 bg-gradient-to-br from-blue-50/60 to-cyan-50/30 dark:from-blue-950/25 dark:to-cyan-950/15 space-y-3 sm:space-y-3.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs sm:text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
          <i className="fas fa-inbox text-blue-600 dark:text-blue-400 mr-0.5"></i>
          <span>Сбор ответов</span>
        </Label>
        <Switch
          checked={condition.collectUserInput ?? false}
          onCheckedChange={(checked) => updateCondition(condition, selectedNode, { collectUserInput: checked }, onNodeUpdate)}
        />
      </div>
      {condition.collectUserInput && (
        <div className="space-y-3 sm:space-y-3.5 pt-2 border-t border-blue-200/40 dark:border-blue-800/40">
          <div className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 px-3 py-2 rounded-lg leading-relaxed">
            <i className="fas fa-info-circle mr-2"></i>
            Собирать ввод пользователя в переменные
          </div>
          <ConditionalMediaToggles condition={condition} selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
          <ConditionalVariableInputs condition={condition} selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
          <ConditionalTransition
            condition={condition}
            selectedNode={selectedNode}
            getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            onNodeUpdate={onNodeUpdate}
          />
        </div>
      )}
    </div>
  );
}
