/**
 * @fileoverview Компонент выбора вопросов для условных сообщений
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QuestionCheckboxList } from './question-checkbox-list';
import { LogicOperatorSelector } from './logic-operator-selector';
import { SelectedQuestions } from './selected-questions';

interface Question { name: string; nodeId: string; nodeType?: string; mediaType?: string; }
interface VariableNamesSectionProps {
  condition: any;
  selectedNode: Node;
  availableQuestions: Question[];
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

const updateVariables = (condition: any, selectedNode: Node, names: string[], onNodeUpdate: any) => {
  const conditions = selectedNode.data.conditionalMessages || [];
  onNodeUpdate(selectedNode.id, {
    conditionalMessages: conditions.map((c: any) => c.id === condition.id
      ? { ...c, variableNames: names, variableName: names[0] || '' } : c)
  });
};

export function VariableNamesSection({ condition, selectedNode, availableQuestions, onNodeUpdate }: VariableNamesSectionProps) {
  const handleUpdate = (names: string[]) => updateVariables(condition, selectedNode, names, onNodeUpdate);
  const handleLogic = (value: 'AND' | 'OR') => {
    const conditions = selectedNode.data.conditionalMessages || [];
    onNodeUpdate(selectedNode.id, {
      conditionalMessages: conditions.map((c: any) => c.id === condition.id ? { ...c, logicOperator: value } : c)
    });
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <Label className="text-xs sm:text-sm font-semibold text-foreground flex items-center gap-2">
        <i className="fas fa-question text-blue-600 dark:text-blue-400"></i>
        <span>На какие вопросы ответил?</span>
      </Label>
      {availableQuestions.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          <QuestionCheckboxList availableQuestions={availableQuestions} selectedNames={condition.variableNames || []} onSelectionChange={handleUpdate} />
          {(condition.variableNames?.length || 0) > 1 && (
            <LogicOperatorSelector value={condition.logicOperator || 'AND'} onChange={handleLogic} />
          )}
          <div>
            <Label className="text-xs font-medium text-muted-foreground mb-1 block">Или добавьте вручную:</Label>
            <Input value={(condition.variableNames || []).join(', ')} onChange={(e) => handleUpdate(e.target.value.split(',').map((n: string) => n.trim()).filter((n: string) => n))}
              className="text-xs" placeholder="имя, пол, возраст" />
            <div className="text-xs text-muted-foreground mt-1">Введите названия через запятую</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 sm:py-8 px-4 text-muted-foreground bg-gradient-to-br from-slate-50/50 to-slate-50/30 dark:from-slate-900/20 dark:to-slate-950/20 rounded-xl border border-slate-200/40 dark:border-slate-800/40">
          <i className="fas fa-inbox text-2xl sm:text-3xl mb-3 opacity-50"></i>
          <div className="text-xs sm:text-sm font-medium">Нет доступных вопросов</div>
          <div className="text-xs text-muted-foreground mt-1">Создайте узлы со сбором ответов</div>
        </div>
      )}
      <SelectedQuestions selectedNames={condition.variableNames || []} />
    </div>
  );
}
