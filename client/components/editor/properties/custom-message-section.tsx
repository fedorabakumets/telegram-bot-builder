/**
 * @fileoverview Компонент кастомного сообщения для условного сообщения
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { InlineRichEditor } from './inline-rich-editor';

interface CustomMessageSectionProps {
  condition: any;
  selectedNode: any;
  textVariables: any[];
  onNodeUpdate: (nodeId: string, updates: any) => void;
}

const updateCondition = (condition: any, selectedNode: any, updates: any, onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, {
    conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, ...updates } : c)
  });
};

/**
 * Компонент кастомного сообщения
 */
export function CustomMessageSection({ condition, selectedNode, textVariables, onNodeUpdate }: CustomMessageSectionProps) {
  const showCustomMessage = (condition as any).showCustomMessage ?? false;

  return (
    <div className="border border-green-200/50 dark:border-green-800/50 rounded-xl p-3 sm:p-4 bg-gradient-to-br from-green-50/60 to-emerald-50/30 dark:from-green-950/25 dark:to-emerald-950/15 space-y-3 sm:space-y-3.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs sm:text-sm font-semibold text-green-700 dark:text-green-300 flex items-center gap-2">
          <i className="fas fa-message text-green-600 dark:text-green-400"></i>
          <span>Кастомное сообщение (опционально)</span>
        </Label>
        <Switch
          checked={showCustomMessage}
          onCheckedChange={(checked) => updateCondition(condition, selectedNode, { showCustomMessage: checked }, onNodeUpdate)}
        />
      </div>
      {showCustomMessage && (
        <div className="space-y-2">
          <InlineRichEditor
            value={condition.messageText}
            onChange={(value) => updateCondition(condition, selectedNode, { messageText: value }, onNodeUpdate)}
            placeholder="Добро пожаловать обратно! Рады вас снова видеть."
            enableMarkdown={condition.formatMode === 'markdown'}
            availableVariables={textVariables}
          />
          <div className="text-xs text-green-600 dark:text-green-400">
            Если не указано, будет использоваться основной текст узла
          </div>
        </div>
      )}
    </div>
  );
}
