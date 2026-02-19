/**
 * @fileoverview Компонент переключателей ввода для условного сообщения
 * @description Отображает сетку переключателей типов ввода (текст, фото, видео, аудио, документ).
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CONDITIONAL_TOGGLE_CONFIGS, ConditionalInputToggleConfig } from './conditional-input-config';

interface ConditionalMediaTogglesProps {
  condition: any;
  selectedNode: any;
  onNodeUpdate: (nodeId: string, updates: any) => void;
}

const updateCondition = (condition: any, selectedNode: any, updates: any, onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, {
    conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, ...updates } : c)
  });
};

const handleToggle = (condition: any, selectedNode: any, type: string, checked: boolean, onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, {
    conditionalMessages: conditions.map((c: any) => {
      if (c.id !== condition.id) return c;
      const updated = { ...c, [type]: checked };
      if (checked) updated.collectUserInput = true;
      else {
        const others = ['enableTextInput', 'enablePhotoInput', 'enableVideoInput', 'enableAudioInput', 'enableDocumentInput'].filter(t => t !== type);
        const anyEnabled = others.some((t: string) => c[t]);
        if (!anyEnabled) updated.collectUserInput = false;
      }
      if (type === 'enableTextInput') updated.waitForTextInput = checked;
      return updated;
    })
  });
};

/**
 * Компонент переключателей ввода для условного сообщения
 */
export function ConditionalMediaToggles({ condition, selectedNode, onNodeUpdate }: ConditionalMediaTogglesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
      {CONDITIONAL_TOGGLE_CONFIGS.map((config: ConditionalInputToggleConfig) => (
        <div key={config.type} className={`flex flex-col sm:flex-row sm:items-start sm:justify-between p-2.5 sm:p-3 rounded-lg bg-gradient-to-br ${config.colors.bg} border ${config.colors.border} ${config.colors.hoverBorder} hover:shadow-sm transition-all duration-200`}>
          <div className="flex-1 min-w-0">
            <Label className={`text-xs sm:text-sm font-semibold ${config.colors.text} flex items-center gap-1.5`}>
              <i className={`fas ${config.icon} text-xs sm:text-sm`}></i>
              {config.title}
            </Label>
            <div className={`text-xs ${config.colors.desc} ${config.colors.descDark} mt-1 line-clamp-2`}>{config.description}</div>
          </div>
          <div className="mt-2 sm:mt-0 sm:ml-2 flex-shrink-0">
            <Switch
              checked={condition[config.type] ?? (config.type === 'enableTextInput' ? condition.waitForTextInput : false) ?? false}
              onCheckedChange={(checked) => handleToggle(condition, selectedNode, config.type, checked, onNodeUpdate)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
