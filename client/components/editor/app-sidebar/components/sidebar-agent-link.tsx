/** @fileoverview Переход к агенту в служебной группе сайдбара рядом со сценариями. */
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/utils';

/** Параметры служебной кнопки агента. */
interface SidebarAgentLinkProps {
  /** Активна ли вкладка агента. */
  active: boolean;
  /** Свёрнут ли сайдбар. */
  isCollapsed?: boolean;
  /** Открыть вкладку агента. */
  onOpen: () => void;
}

/**
 * Показывает кнопку агента с тем же состоянием выбора, что у вкладок редактора.
 * @param props - Состояние и обработчик перехода
 * @returns Кнопка служебной группы
 */
export function SidebarAgentLink({ active, isCollapsed, onOpen }: SidebarAgentLinkProps) {
  return <Button variant="ghost" onClick={onOpen} aria-label="Агент" title="Агент" aria-current={active ? 'page' : undefined}
    className={cn('w-full justify-start gap-2 h-9 px-2', isCollapsed && 'justify-center px-0',
      active ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600' : 'text-muted-foreground hover:bg-muted/60')}>
    <Sparkles className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
    {!isCollapsed && <span className="text-sm whitespace-nowrap">Агент</span>}
  </Button>;
}
