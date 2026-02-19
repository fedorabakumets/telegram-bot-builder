/**
 * @fileoverview Компонент пустого состояния для условных сообщений
 * @description Отображает информацию о преимуществах и кнопку создания первого условия.
 */

import { Node } from '@shared/schema';

interface EmptyConditionalStateProps {
  selectedNode: Node;
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Компонент пустого состояния для условных сообщений
 */
export function EmptyConditionalState({ selectedNode, onNodeUpdate }: EmptyConditionalStateProps) {
  const handleAddCondition = () => {
    const currentConditions = selectedNode.data.conditionalMessages || [];
    const nextPriority = Math.max(0, ...currentConditions.map((c: any) => c.priority || 0)) + 10;
    onNodeUpdate(selectedNode.id, {
      conditionalMessages: [...currentConditions, {
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
        priority: nextPriority
      }]
    });
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-3 sm:px-4">
      <div className="relative mb-4 sm:mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-300/20 to-blue-300/20 dark:from-purple-700/10 dark:to-blue-700/10 rounded-full blur-xl"></div>
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 border border-purple-200/50 dark:border-purple-700/50 flex items-center justify-center">
          <i className="fas fa-wand-magic-sparkles text-2xl sm:text-3xl text-purple-600 dark:text-purple-400"></i>
        </div>
      </div>

      <div className="text-center max-w-sm">
        <h3 className="text-sm sm:text-base font-semibold text-foreground mb-2">
          Создайте первое условное сообщение
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed">
          Условия позволяют показывать разные сообщения в зависимости от ответов пользователя
        </p>

        <div className="space-y-2 mb-6 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-start gap-2 justify-center">
            <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5 flex-shrink-0">✓</span>
            <span>Проверяйте сохраненные ответы пользователя</span>
          </div>
          <div className="flex items-start gap-2 justify-center">
            <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5 flex-shrink-0">✓</span>
            <span>Показывайте персонализированные сообщения</span>
          </div>
          <div className="flex items-start gap-2 justify-center">
            <span className="text-purple-600 dark:text-purple-400 font-bold mt-0.5 flex-shrink-0">✓</span>
            <span>Автоматически маршрутизируйте по разным веткам</span>
          </div>
        </div>

        <button
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 transition-all duration-200 text-white text-xs sm:text-sm font-medium shadow-sm hover:shadow-md"
          onClick={handleAddCondition}
        >
          <span className="flex items-center justify-center gap-1.5">
            <span className="inline-block">+</span>
            Добавить условие
          </span>
        </button>
      </div>
    </div>
  );
}
