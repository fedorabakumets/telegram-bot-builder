/**
 * @fileoverview Карточка условного сообщения
 * 
 * Основной компонент карточки условия, объединяющий заголовок, список конфликтов и содержимое.
 */

import { ConditionalMessageCardHeader } from './conditional-message-card-header';
import { ConditionalMessageConflictsList } from './conditional-message-conflicts-list';
import { ConditionContent } from '../conditional/condition-content';
import type { Node } from '@shared/schema';
import type { RuleConflict } from '../../utils/conditional-utils';
import type { ProjectVariable } from '../../utils/variables-utils';
import { SYSTEM_VARIABLES } from '../variables/system-variables';

/** Пропсы карточки условного сообщения */
interface ConditionalMessageCardProps {
  /** Индекс условия */
  index: number;
  /** Объект условия */
  condition: any;
  /** Выбранный узел */
  selectedNode: Node;
  /** Доступные вопросы */
  availableQuestions: ProjectVariable[];
  /** Текстовые переменные */
  textVariables: ProjectVariable[];
  /** Все узлы для навигации */
  getAllNodesFromAllSheets: any[];
  /** Функция форматирования отображения узла */
  formatNodeDisplay: (node: any, sheetName?: string) => string;
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Список конфликтов правил */
  ruleConflicts: RuleConflict[];
  /** Флаг наличия ошибок */
  hasErrors: boolean;
  /** Флаг наличия предупреждений */
  hasWarnings: boolean;
}

/**
 * Компонент карточки условного сообщения
 * 
 * @param {ConditionalMessageCardProps} props - Пропсы компонента
 * @returns {JSX.Element} Карточка условного сообщения
 */
export function ConditionalMessageCard({
  index,
  condition,
  selectedNode,
  availableQuestions,
  textVariables,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  onNodeUpdate,
  ruleConflicts,
  hasErrors,
  hasWarnings
}: ConditionalMessageCardProps) {
  const getCardClassName = () => {
    if (hasErrors) {
      return 'border-red-400/60 dark:border-red-600/60 bg-red-50/30 dark:bg-red-950/20 shadow-sm shadow-red-200/40 dark:shadow-red-900/20';
    }
    if (hasWarnings) {
      return 'border-yellow-400/50 dark:border-yellow-600/50 bg-yellow-50/30 dark:bg-yellow-950/20 shadow-sm shadow-yellow-200/40 dark:shadow-yellow-900/20';
    }
    return 'border-purple-300/40 dark:border-purple-700/40 bg-purple-50/20 dark:bg-purple-950/10 hover:border-purple-400/60 dark:hover:border-purple-700/60 shadow-sm hover:shadow-md shadow-transparent dark:shadow-transparent hover:shadow-purple-200/30 dark:hover:shadow-purple-900/20 transition-all hover:scale-[1.01]';
  };

  return (
    <div className={`border rounded-lg sm:rounded-xl transition-all duration-300 overflow-hidden ${getCardClassName()}`}>
      <ConditionalMessageCardHeader
        index={index}
        variableNames={condition.variableNames}
        priority={condition.priority}
        hasErrors={hasErrors}
        hasWarnings={hasWarnings}
        onIncreasePriority={() => {
          const currentConditions = selectedNode.data.conditionalMessages || [];
          const updatedConditions = currentConditions.map((c: ConditionalMessage) =>
            c.id === condition.id ? { ...c, priority: (c.priority || 0) + 10 } : c
          );
          onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
        }}
        onDecreasePriority={() => {
          const currentConditions = selectedNode.data.conditionalMessages || [];
          const updatedConditions = currentConditions.map((c: ConditionalMessage) =>
            c.id === condition.id ? { ...c, priority: Math.max(0, (c.priority || 0) - 10) } : c
          );
          onNodeUpdate(selectedNode.id, { conditionalMessages: updatedConditions });
        }}
        onDelete={() => {
          const currentConditions = selectedNode.data.conditionalMessages || [];
          const newConditions = currentConditions.filter((c: ConditionalMessage) => c.id !== condition.id);
          onNodeUpdate(selectedNode.id, { conditionalMessages: newConditions });
        }}
      />

      {ruleConflicts.length > 0 && (
        <ConditionalMessageConflictsList ruleConflicts={ruleConflicts} />
      )}

      <ConditionContent
        condition={condition}
        selectedNode={selectedNode}
        availableQuestions={availableQuestions}
        textVariables={textVariables}
        SYSTEM_VARIABLES={SYSTEM_VARIABLES}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        formatNodeDisplay={formatNodeDisplay}
        onNodeUpdate={onNodeUpdate}
      />
    </div>
  );
}
