/**
 * @fileoverview Переключатель сохранения ID в CSV файл
 * Позволяет сохранять введённый пользователем ID в CSV файл на сервере
 */

import { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileSpreadsheet } from 'lucide-react';

/**
 * Свойства компонента сохранения в CSV
 */
interface SaveToCsvSwitchProps {
  /** Данные узла для редактирования */
  selectedNode: Node;
  /** Колбэк для обновления данных узла */
  onNodeUpdate: (nodeId: string, data: Partial<Node['data']>) => void;
}

/**
 * Компонент переключателя сохранения ID в CSV файл
 */
export function SaveToCsvSwitch({ selectedNode, onNodeUpdate }: SaveToCsvSwitchProps) {
  const isSaveToCsvEnabled = selectedNode.data.saveToCsv ?? false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-800/40">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <div>
            <Label htmlFor="saveToCsv" className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Сохранять в CSV файл
            </Label>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Файл на сервере проекта
            </p>
          </div>
        </div>
        <Switch
          id="saveToCsv"
          checked={isSaveToCsvEnabled}
          onCheckedChange={(checked) => {
            onNodeUpdate(selectedNode.id, {
              saveToCsv: checked,
              collectUserInput: checked ? true : selectedNode.data.collectUserInput,
            });
          }}
        />
      </div>

      {isSaveToCsvEnabled && (
        <Alert className="bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/50">
          <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
            Введённый пользователем ID будет сохранён в файл{" "}
            <code className="bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded text-blue-700 dark:text-blue-300">user_ids.csv</code>{" "}
            в папке проекта. Один ID в строке.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
