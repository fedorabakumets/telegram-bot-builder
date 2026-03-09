/**
 * @fileoverview Компонент настроек reply клавиатуры
 */

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ReplyKeyboardSettingsProps {
  condition: any;
  onNodeUpdate: (nodeId: string, updates: any) => void;
}

const updateCondition = (condition: any, selectedNode: any, updates: any, onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, {
    conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, ...updates } : c)
  });
};

/**
 * Компонент настроек reply клавиатуры
 */
export function ReplyKeyboardSettings({ condition, onNodeUpdate }: ReplyKeyboardSettingsProps) {
  return (
    <div className="border-t border-purple-100/30 dark:border-purple-800/20 pt-2.5 space-y-2">
      <Label className="text-xs font-medium text-foreground block">Параметры</Label>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-purple-700 dark:text-purple-400 cursor-pointer">Авто-размер</Label>
        <Switch
          checked={condition.resizeKeyboard ?? true}
          onCheckedChange={(checked) => updateCondition(condition, condition, { resizeKeyboard: checked }, onNodeUpdate)}
        />
      </div>
      <div className="flex items-center justify-between">
        <Label className="text-xs text-purple-700 dark:text-purple-400 cursor-pointer">Скрыть после первого нажатия</Label>
        <Switch
          checked={condition.oneTimeKeyboard ?? false}
          onCheckedChange={(checked) => updateCondition(condition, condition, { oneTimeKeyboard: checked }, onNodeUpdate)}
        />
      </div>
    </div>
  );
}
