/**
 * @fileoverview Панель свойств для отдельного узла сохранения ответа пользователя.
 */

import type { Node } from '@shared/schema';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InputNavigationGrid } from '../navigation/input-navigation-grid';
import { PropertyCheckbox } from '../common/property-checkbox';
import { MediaMetadataInfo } from './media-metadata-info';
import { SaveAnswerStorageHint } from './save-answer-storage-hint';
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

/** Медиа-типы для которых доступно сохранение метаданных */
const MEDIA_INPUT_TYPES = ['photo', 'video', 'audio', 'document'];

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
  const isMediaType = MEDIA_INPUT_TYPES.includes(inputType);
  const saveMediaMetadata = !!data.saveMediaMetadata;
  const variableName = data.inputVariable || '';

  return (
    <div className="min-w-0 space-y-4">
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

      {isMediaType && (
        <div className="space-y-2">
          <PropertyCheckbox
            id="saveMediaMetadata"
            label="Сохранить метаданные медиа"
            description="Дополнительные переменные с информацией о файле"
            checked={saveMediaMetadata}
            onChange={(checked) =>
              onNodeUpdate(selectedNode.id, { saveMediaMetadata: checked })
            }
          />
          {saveMediaMetadata && (
            <MediaMetadataInfo
              inputType={inputType}
              variableName={variableName}
              enabledSuffixes={data.mediaMetadataSuffixes || []}
              onSuffixesChange={(suffixes) =>
                onNodeUpdate(selectedNode.id, { mediaMetadataSuffixes: suffixes })
              }
              customNames={data.mediaMetadataCustomNames || {}}
              onCustomNamesChange={(names) =>
                onNodeUpdate(selectedNode.id, { mediaMetadataCustomNames: names })
              }
              availableVariables={textVariables}
            />
          )}
        </div>
      )}
      <SaveAnswerStorageHint inputType={inputType} />
    </div>
  );
}
