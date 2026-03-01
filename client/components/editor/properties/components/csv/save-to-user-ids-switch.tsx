/**
 * @fileoverview Переключатель сохранения ID в базу для рассылки
 * Позволяет сохранять введённый пользователем ID напрямую в таблицу user_ids
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database } from 'lucide-react';

/**
 * Свойства компонента сохранения в базу ID
 */
interface SaveToUserIdsSwitchProps {
  /** Данные узла для редактирования */
  selectedNode: Node;
  /** Колбэк для обновления данных узла */
  onNodeUpdate: (nodeId: string, data: Partial<Node['data']>) => void;
}

/**
 * Компонент переключателя сохранения ID в базу для рассылки
 */
export function SaveToUserIdsSwitch({ selectedNode, onNodeUpdate }: SaveToUserIdsSwitchProps) {
  const isSaveToUserIdsEnabled = selectedNode.data.saveToUserIds ?? false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-green-50/40 dark:bg-green-950/20 border border-green-200/40 dark:border-green-800/40">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
          <div>
            <Label htmlFor="saveToUserIds" className="text-sm font-medium text-green-900 dark:text-green-100">
              Сохранять в базу ID
            </Label>
            <p className="text-xs text-green-700 dark:text-green-300">
              Для использования в рассылке
            </p>
          </div>
        </div>
        <Switch
          id="saveToUserIds"
          checked={isSaveToUserIdsEnabled}
          onCheckedChange={(checked) => {
            onNodeUpdate(selectedNode.id, { 
              saveToUserIds: checked,
              // Если включаем, автоматически включаем сбор ввода
              collectUserInput: checked ? true : selectedNode.data.collectUserInput,
            });
          }}
        />
      </div>

      {isSaveToUserIdsEnabled && (
        <Alert className="bg-green-50/50 dark:bg-green-950/30 border-green-200/50 dark:border-green-800/50">
          <AlertDescription className="text-xs text-green-800 dark:text-green-200">
            Введённый пользователем ID будет автоматически сохранён в таблицу{" "}
            <code className="bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 rounded text-green-700 dark:text-green-300">user_ids</code>{" "}
            для последующего использования в рассылках.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
