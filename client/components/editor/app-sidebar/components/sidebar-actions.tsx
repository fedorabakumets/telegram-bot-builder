/**
 * @fileoverview Кнопки действий сайдбара: загрузить и сохранить сценарий
 */

import { FolderOpen, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/**
 * Пропсы компонента SidebarActions
 */
interface SidebarActionsProps {
  /** Обработчик загрузки сценария */
  onLoadTemplate?: () => void;
  /** Обработчик сохранения сценария */
  onSaveAsTemplate?: () => void;
  /** Свёрнут ли сайдбар */
  isCollapsed?: boolean;
}

/**
 * Кнопки действий: загрузить и сохранить сценарий
 * @param props - Свойства компонента
 * @returns JSX элемент с кнопками действий
 */
export function SidebarActions({ onLoadTemplate, onSaveAsTemplate, isCollapsed }: SidebarActionsProps) {
  const btnClass = cn(
    'w-full justify-start gap-2 h-9 px-2 text-muted-foreground hover:bg-muted/60',
    isCollapsed && 'justify-center px-0'
  );

  return (
    <div className="flex flex-col gap-1">
      <Button variant="ghost" className={btnClass} onClick={onLoadTemplate}>
        <FolderOpen className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span className="text-sm">Загрузить сценарий</span>}
      </Button>
      <Button variant="ghost" className={btnClass} onClick={onSaveAsTemplate}>
        <Save className="h-4 w-4 flex-shrink-0" />
        {!isCollapsed && <span className="text-sm">Сохранить сценарий</span>}
      </Button>
    </div>
  );
}
