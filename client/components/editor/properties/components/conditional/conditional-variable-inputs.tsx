/**
 * @fileoverview Компонент полей ввода переменных для условного сообщения
 * @description Отображает поля имён переменных для включённых типов ввода.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CONDITIONAL_VARIABLE_INPUTS, ConditionalVariableInputConfig } from './conditional-variable-input-config';

interface ConditionalVariableInputsProps {
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

/**
 * Компонент полей ввода переменных для условного сообщения
 */
export function ConditionalVariableInputs({ condition, selectedNode, onNodeUpdate }: ConditionalVariableInputsProps) {
  const hasAnyInput = condition.enableTextInput || condition.waitForTextInput || condition.enablePhotoInput ||
    condition.enableVideoInput || condition.enableAudioInput || condition.enableDocumentInput;

  if (!hasAnyInput) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 pt-2 border-t border-blue-200/30 dark:border-blue-800/30">
      {CONDITIONAL_VARIABLE_INPUTS.map((config: ConditionalVariableInputConfig) => {
        const isEnabled = config.enableKey === 'enableTextInput'
          ? (condition.enableTextInput || condition.waitForTextInput)
          : condition[config.enableKey];

        if (!isEnabled) return null;

        const value = condition[config.variableKey] || condition.inputVariable || condition.variableName || '';

        return (
          <div key={config.variableKey}>
            <Label className={`text-xs sm:text-sm font-medium ${config.colors.text} mb-1 block`}>
              <i className="fas fa-tag mr-1"></i>
              {config.title}
            </Label>
            <Input
              value={value}
              onChange={(e) => {
                const updates: any = { [config.variableKey]: e.target.value };
                if (config.variableKey === 'textInputVariable') {
                  updates.inputVariable = e.target.value;
                }
                updateCondition(condition, selectedNode, updates, onNodeUpdate);
              }}
              className={`text-xs sm:text-sm ${config.colors.border} ${config.colors.focusBorder} ${config.colors.focusRing}`}
              placeholder={config.placeholder}
            />
          </div>
        );
      })}
    </div>
  );
}
