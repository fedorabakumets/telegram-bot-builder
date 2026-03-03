/**
 * @fileoverview Действия с условными сообщениями
 * 
 * Компонент отображает кнопки действий для управления условными сообщениями.
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

/** Пропсы компонента */
interface ConditionalMessagesActionsProps {
  /** Функция автоматического исправления приоритетов */
  autoFixPriorities: () => void;
  /** Функция добавления нового условия */
  onAddCondition: (condition: any) => void;
}

/**
 * Компонент действий с условными сообщениями
 * 
 * @param {ConditionalMessagesActionsProps} props - Пропсы компонента
 * @returns {JSX.Element} Действия с условиями
 */
export function ConditionalMessagesActions({
  autoFixPriorities,
  onAddCondition
}: ConditionalMessagesActionsProps) {
  const handleAddCondition = () => {
    const newCondition = {
      id: `condition-${Date.now()}`,
      condition: 'user_data_exists' as const,
      variableName: '',
      variableNames: [],
      logicOperator: 'AND' as const,
      messageText: 'Добро пожаловать обратно!',
      formatMode: 'text' as const,
      keyboardType: 'none' as const,
      buttons: [],
      collectUserInput: false,
      enableTextInput: false,
      enablePhotoInput: false,
      enableVideoInput: false,
      enableAudioInput: false,
      enableDocumentInput: false,
      waitForTextInput: false,
      priority: 10
    };
    onAddCondition(newCondition);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
      <Label className="text-xs sm:text-sm font-semibold text-purple-700 dark:text-purple-300">
        📋 Условия
      </Label>
      <div className="flex gap-1.5 w-full sm:w-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={autoFixPriorities}
          className="flex-1 sm:flex-none text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-200"
          title="Автоматически расставить приоритеты для избежания конфликтов"
        >
          <i className="fas fa-sort-amount-down text-xs"></i>
          <span className="hidden sm:inline ml-1.5">Приоритеты</span>
        </Button>
        <Button
          size="sm"
          variant="default"
          onClick={handleAddCondition}
          className="flex-1 sm:flex-none text-xs bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-200"
        >
          <i className="fas fa-plus text-xs"></i>
          <span className="hidden sm:inline ml-1.5">Новое</span>
        </Button>
      </div>
    </div>
  );
}
