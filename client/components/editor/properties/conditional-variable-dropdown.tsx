/**
 * @fileoverview Компонент выбора переменной для текста кнопки
 */

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button as UIButton } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

interface VariableDropdownProps {
  textVariables: any[];
  SYSTEM_VARIABLES: any[];
  onInsert: (text: string) => void;
}

const getBadgeText = (nodeType: string) => {
  const map: Record<string, string> = {
    'user-input': 'Ввод', 'start': 'Команда', 'command': 'Команда',
    'system': 'Система', 'conditional': 'Условие'
  };
  return map[nodeType] || 'Другое';
};

export function ConditionalVariableDropdown({ textVariables, SYSTEM_VARIABLES, onInsert }: VariableDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <UIButton size="sm" variant="outline" className="h-7 text-xs gap-1" title="Вставить переменную">
          <Plus className="h-3 w-3" />
          <span className="hidden sm:inline">Переменная</span>
        </UIButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs">Доступные переменные</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {[...SYSTEM_VARIABLES, ...textVariables].map((variable, index) => (
          <DropdownMenuItem key={`${variable.nodeId}-${variable.name}-${index}`} className="cursor-pointer"
            onClick={() => onInsert(`{${variable.name}}`)}>
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center gap-2">
                <code className="text-xs bg-muted px-1 py-0.5 rounded">{`{${variable.name}}`}</code>
                <Badge variant="outline" className="text-xs h-4">{getBadgeText(variable.nodeType)}</Badge>
              </div>
              {variable.description && <div className="text-xs text-muted-foreground">{variable.description}</div>}
            </div>
          </DropdownMenuItem>
        ))}
        {textVariables.length === 0 && <DropdownMenuItem disabled><span className="text-xs text-muted-foreground">Нет доступных переменных</span></DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
