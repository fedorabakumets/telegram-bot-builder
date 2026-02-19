/**
 * @fileoverview Компонент футера панели свойств
 * 
 * Содержит кнопки сброса и применения изменений узла.
 * 
 * @module PropertiesFooter
 */

import { Node } from '@shared/schema';
import { Button as UIButton } from '@/components/ui/button';

/**
 * Пропсы компонента футера панели свойств
 */
interface PropertiesFooterProps {
  /** Выбранный узел для редактирования */
  selectedNode: Node;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент футера панели свойств
 * 
 * Содержит кнопки:
 * - Сбросить — возвращает узел к значениям по умолчанию
 * - Применить — применяет изменения (визуально)
 * 
 * @param {PropertiesFooterProps} props - Пропсы компонента
 * @returns {JSX.Element} Футер панели свойств
 */
export function PropertiesFooter({ selectedNode, onNodeUpdate }: PropertiesFooterProps) {
  return (
    <div className="sticky bottom-0 p-2.5 sm:p-3 lg:p-4 border-t border-border/50 bg-gradient-to-r from-background via-background to-muted/5 dark:from-background dark:via-background dark:to-muted/2 backdrop-blur-sm">
      <div className="flex flex-col xs:flex-row gap-2 xs:space-x-2">
        <UIButton
          variant="outline"
          size="sm"
          className="flex-1 text-xs sm:text-sm h-8 sm:h-9 hover:bg-muted/80 dark:hover:bg-muted/60 transition-all duration-200"
          onClick={() => {
            onNodeUpdate(selectedNode.id, {
              messageText: '',
              keyboardType: 'none',
              buttons: [],
              markdown: false,
              oneTimeKeyboard: false,
              resizeKeyboard: true
            });
          }}
        >
          <i className="fas fa-redo-alt mr-1.5"></i>
          Сбросить
        </UIButton>
        <UIButton
          size="sm"
          className="flex-1 text-xs sm:text-sm h-8 sm:h-9 bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/80 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <i className="fas fa-check mr-1.5"></i>
          Применить
        </UIButton>
      </div>
    </div>
  );
}
