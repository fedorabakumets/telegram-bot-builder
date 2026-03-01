/**
 * @fileoverview Компонент содержимого условия для условного сообщения
 * @description Объединяет все секции настройки условия: тип, переменные, значение, сообщение, сбор ответов, клавиатура.
 */

import { ConditionTypeSelector } from './condition-type-selector';
import { VariableNamesSection } from './variable-names-section';
import { ExpectedValueInput } from './expected-value-input';
import { CustomMessageSection } from './custom-message-section';
import { ConditionalCollectionSection } from './conditional-collection-section';
import { ConditionalKeyboardConfig } from './conditional-keyboard-config';

interface ConditionContentProps {
  condition: any;
  selectedNode: any;
  availableQuestions: any[];
  textVariables: any[];
  SYSTEM_VARIABLES: any[];
  getAllNodesFromAllSheets: Array<{ node: any; sheetName: string }>;
  formatNodeDisplay: (node: any, sheetName: string) => string;
  onNodeUpdate: (nodeId: string, updates: any) => void;
}

/**
 * Компонент содержимого условия
 */
export function ConditionContent({
  condition,
  selectedNode,
  availableQuestions,
  textVariables,
  SYSTEM_VARIABLES,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  onNodeUpdate
}: ConditionContentProps) {
  const handleConditionChange = (value: any) => {
    const conditions = selectedNode.data.conditionalMessages || [];
    onNodeUpdate(selectedNode.id, {
      conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, condition: value } : c)
    });
  };

  const needsVariableNames = ['user_data_exists', 'user_data_not_exists', 'user_data_equals', 'user_data_contains'].includes(condition.condition);
  const needsExpectedValue = ['user_data_equals', 'user_data_contains'].includes(condition.condition);

  return (
    <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4 sm:space-y-5 border-t border-white/40 dark:border-slate-800/40">
      <ConditionTypeSelector condition={condition} onConditionChange={handleConditionChange} />
      
      {needsVariableNames && (
        <VariableNamesSection
          condition={condition}
          selectedNode={selectedNode}
          availableQuestions={availableQuestions}
          onNodeUpdate={onNodeUpdate}
        />
      )}
      
      {needsExpectedValue && (
        <ExpectedValueInput
          condition={condition}
          selectedNode={selectedNode}
          onNodeUpdate={onNodeUpdate}
        />
      )}
      
      <CustomMessageSection
        condition={condition}
        selectedNode={selectedNode}
        textVariables={textVariables}
        onNodeUpdate={onNodeUpdate}
      />
      
      <ConditionalCollectionSection
        condition={condition}
        selectedNode={selectedNode}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
      />
      
      <ConditionalKeyboardConfig
        condition={condition}
        selectedNode={selectedNode}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        formatNodeDisplay={formatNodeDisplay}
        textVariables={textVariables}
        SYSTEM_VARIABLES={SYSTEM_VARIABLES}
        onNodeUpdate={onNodeUpdate}
      />
    </div>
  );
}
