/**
 * @fileoverview Переключатель режима сохранения переменной
 * Позволяет выбрать: перезаписывать или сохранять в массив.
 * @module append-variable-toggle
 */

import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Node } from '@shared/schema';

/** Пропсы компонента AppendVariableToggle */
interface AppendVariableToggleProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Функция обновления узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
}

/**
 * Переключатель режима сохранения переменной.
 * - Выключено: перезаписывать значение (по умолчанию)
 * - Включено: добавлять в массив (не перезаписывать)
 * @param {AppendVariableToggleProps} props - Пропсы компонента
 * @returns {JSX.Element} Переключатель режима
 */
export function AppendVariableToggle({
  selectedNode,
  onNodeUpdate
}: AppendVariableToggleProps) {
  const isAppendMode = selectedNode.data.appendVariable ?? false;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 p-2.5 sm:p-3 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 border border-amber-200/40 dark:border-amber-800/40">
        <div className="flex items-center gap-2">
          <i className="fas fa-layer-group text-amber-600 dark:text-amber-400 text-sm"></i>
          <div>
            <Label htmlFor="appendVariable" className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Не перезаписывать
            </Label>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Сохранять все значения в массив
            </p>
          </div>
        </div>
        <Switch
          id="appendVariable"
          checked={isAppendMode}
          onCheckedChange={(checked) => {
            onNodeUpdate(selectedNode.id, {
              appendVariable: checked
            });
          }}
        />
      </div>

      {isAppendMode && (
        <Alert className="bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/50">
          <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
            <div className="space-y-1">
              <div>
                <strong>Режим массива:</strong> значения сохраняются как{" "}
                <code className="bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">
                  ["val1", "val2", "val3"]
                </code>
              </div>
              <div className="text-amber-600 dark:text-amber-400 mt-1">
                💡 В тексте используйте <code className="bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">{`{email|join:", "}`}</code> для вывода через запятую
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
