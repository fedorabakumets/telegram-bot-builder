/**
 * @fileoverview Панель свойств для отдельного узла сохранения ответа пользователя.
 */

import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputNavigationGrid } from '../navigation/input-navigation-grid';
import type { Variable } from '../../../inline-rich/types';

/**
 * Свойства панели сохранения ответа.
 */
interface SaveAnswerPropertiesProps {
  /** Выбранный узел сохранения ответа. */
  selectedNode: Node;
  /** Обновление данных узла. */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Все узлы всех листов для выбора следующего узла. */
  getAllNodesFromAllSheets: Array<{ node: Node; sheetName: string }>;
  /** Форматирование подписи узла в списке. */
  formatNodeDisplay: (node: Node, sheetName: string) => string;
  /** Доступные текстовые переменные. */
  textVariables: Variable[];
}

/**
 * Допустимые значения источника ответа для выпадающего списка.
 */
type SaveAnswerSourceValue =
  | 'any'
  | 'text'
  | 'photo'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'contact'
  | 'number'
  | 'email'
  | 'phone';

export const SAVE_ANSWER_SOURCE_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'any', label: 'Последний ответ' },
  { value: 'text', label: 'Текстовый ответ' },
  { value: 'photo', label: 'Фото' },
  { value: 'video', label: 'Видео' },
  { value: 'audio', label: 'Аудио' },
  { value: 'document', label: 'Документ' },
  { value: 'location', label: 'Геолокация' },
  { value: 'contact', label: 'Контакт' },
  { value: 'callback', label: 'Нажатие кнопки (callback)' },
];

export function SaveAnswerProperties({
  selectedNode,
  onNodeUpdate,
  getAllNodesFromAllSheets,
  formatNodeDisplay,
  textVariables
}: SaveAnswerPropertiesProps) {
  const data = selectedNode.data as any;
  const mode = data.appendVariable ? 'append' : 'replace';
  const inputType = (data.inputType || 'any') as SaveAnswerSourceValue;

  return (
    <div className="w-full bg-gradient-to-br from-cyan-50/40 to-sky-50/20 dark:from-cyan-950/30 dark:to-sky-900/20 rounded-xl p-3 sm:p-4 md:p-5 border border-cyan-200/40 dark:border-cyan-800/40 backdrop-blur-sm space-y-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <i className="fas fa-save text-cyan-500 dark:text-cyan-400 text-sm" />
          <span className="text-sm font-semibold text-cyan-700 dark:text-cyan-300">
            Сохранение ответа
          </span>
        </div>
        <p className="text-xs text-cyan-600/90 dark:text-cyan-400/90">
          Нода сохраняет полученный ответ в переменную и позволяет выбрать следующий узел.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="inputType" className="text-sm font-medium">Источник ответа</Label>
        <Select
          value={inputType}
          onValueChange={(value) => onNodeUpdate(selectedNode.id, { inputType: value as SaveAnswerSourceValue })}
        >
          <SelectTrigger id="inputType" className="w-full">
            <SelectValue placeholder="Выберите источник ответа" />
          </SelectTrigger>
          <SelectContent>
            {SAVE_ANSWER_SOURCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <InputNavigationGrid
        selectedNode={selectedNode}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onNodeUpdate={onNodeUpdate}
        formatNodeDisplay={formatNodeDisplay}
        availableVariables={textVariables}
      />

      <div className="space-y-2">
        <Label htmlFor="saveMode" className="text-sm font-medium">Режим записи</Label>
        <Select
          value={mode}
          onValueChange={(value) => onNodeUpdate(selectedNode.id, { appendVariable: value === 'append' })}
        >
          <SelectTrigger id="saveMode" className="w-full">
            <SelectValue placeholder="Выберите режим" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="replace">Заменить значение</SelectItem>
            <SelectItem value="append">Добавить к существующему</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
