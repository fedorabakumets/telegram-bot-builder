/**
 * @fileoverview Компонент выбора действия для кнопки условного сообщения
 */

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CONDITIONAL_BUTTON_ACTIONS, ConditionalButtonAction } from './conditional-button-config';

interface ConditionalActionSelectorProps {
  action: ConditionalButtonAction;
  onActionChange: (action: ConditionalButtonAction) => void;
}

export function ConditionalActionSelector({ action, onActionChange }: ConditionalActionSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-foreground">Действие</Label>
      <Select value={action} onValueChange={onActionChange}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          {CONDITIONAL_BUTTON_ACTIONS.map((opt) => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
