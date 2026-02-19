/**
 * @fileoverview Компонент списка вариантов ответов для кнопок
 * @description Отображает кнопки с редактированием текста, действия и навигации.
 */

import { Node } from '@shared/schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button as UIButton } from '@/components/ui/button';
import { ActionSelector } from './action-selector';
import { ActionInput } from './action-input';
import { ResponseAction } from './response-action-config';

interface ResponseOptionsListProps {
  selectedNode: Node;
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  formatNodeDisplay: (node: Node, sheetName: string) => string;
}

/**
 * Компонент списка вариантов ответов
 */
export function ResponseOptionsList({
  selectedNode, getAllNodesFromAllSheets, onNodeUpdate, formatNodeDisplay
}: ResponseOptionsListProps) {
  const responseOptions = selectedNode.data.responseOptions || [];

  const updateOptions = (updated: any[]) => onNodeUpdate(selectedNode.id, { responseOptions: updated });
  const addOption = () => updateOptions([...responseOptions, {
    id: Date.now().toString(), text: 'Новый вариант', value: '', action: 'goto' as ResponseAction, target: ''
  }]);
  const removeOption = (i: number) => updateOptions(responseOptions.filter((_, idx) => idx !== i));

  const updateOption = (i: number, updates: any) => {
    const updated = [...responseOptions];
    updated[i] = { ...updated[i], ...updates };
    updateOptions(updated);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Label className="text-xs font-medium text-blue-700 dark:text-blue-300">
          <i className="fas fa-list-ul mr-1"></i>Варианты ответов
        </Label>
        <UIButton size="sm" variant="ghost" onClick={addOption}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">
          + Добавить
        </UIButton>
      </div>
      <div className="space-y-3">
        {responseOptions.map((option, i) => (
          <div key={option.id} className="bg-card/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <Input value={option.text} onChange={(e) => updateOption(i, { text: e.target.value })}
                className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Текст кнопки" />
              <UIButton size="sm" variant="ghost" onClick={() => removeOption(i)}
                className="text-muted-foreground hover:text-destructive h-auto p-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </UIButton>
            </div>
            <div className="space-y-2">
              <div>
                <Label className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1 block">Значение для сохранения</Label>
                <Input value={option.value || ''} onChange={(e) => updateOption(i, { value: e.target.value })}
                  className="text-xs border-blue-200 dark:border-blue-700 focus:border-blue-500 focus:ring-blue-200"
                  placeholder="Значение (если пусто - используется текст кнопки)" />
              </div>
              <ActionSelector action={option.action as ResponseAction} index={i} onActionChange={(idx, a) => updateOption(idx, { action: a })} />
              <div className="mt-2">
                <ActionInput action={option.action as ResponseAction} option={option} index={i}
                  getAllNodesFromAllSheets={getAllNodesFromAllSheets} selectedNode={selectedNode}
                  onOptionsUpdate={updateOptions} formatNodeDisplay={formatNodeDisplay} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
