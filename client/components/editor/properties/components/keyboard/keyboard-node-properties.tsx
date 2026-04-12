/**
 * @fileoverview Панель свойств отдельного узла клавиатуры
 * Показывает настройки кнопок, типа клавиатуры и раскладки.
 * @module components/editor/properties/components/keyboard/keyboard-node-properties
 */

import { Node } from '@shared/schema';
import type { Button } from '@shared/schema';
import type { DynamicButtonsConfig } from '../../types/keyboard-layout';
import { ButtonCard } from '../button-card/button-card';
import { KeyboardButtonsSection } from './keyboard-buttons-section';
import { KeyboardTypeSelector } from './keyboard-type-selector';
import { KeyboardLayoutEditor } from './keyboard-layout-editor';
import { DynamicButtonsSection } from './dynamic-buttons-section';
import { MultipleSelectionSettings } from '../questions/multiple-selection-settings';
import type { ProjectVariable } from '../../utils/variables-utils';
import { normalizeDynamicButtonsConfig } from '../../utils/dynamic-buttons';
import { Switch } from '@/components/ui/switch';
import { generateButtonId } from '@/utils/generate-button-id';

/** Пропсы панели клавиатуры */
interface KeyboardNodePropertiesProps {
  /** Выбранный узел клавиатуры */
  selectedNode: Node;
  /** Текстовые переменные проекта */
  textVariables: ProjectVariable[];
  /** Все узлы для поиска целей переходов */
  getAllNodesFromAllSheets: any[];
  /** Обновление данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<Node['data']>) => void;
  /** Добавление кнопки */
  onButtonAdd: (nodeId: string, button: any) => void;
  /** Обновление кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: any) => void;
  /** Удаление кнопки */
  onButtonDelete: (nodeId: string, buttonId: string) => void;
}

/**
 * Панель свойств узла клавиатуры.
 *
 * @param {KeyboardNodePropertiesProps} props - Пропсы панели
 * @returns {JSX.Element} Содержимое панели клавиатуры
 */
export function KeyboardNodeProperties({
  selectedNode,
  textVariables,
  getAllNodesFromAllSheets,
  onNodeUpdate,
  onButtonAdd,
  onButtonUpdate,
  onButtonDelete,
}: KeyboardNodePropertiesProps) {
  const buttons = selectedNode.data.buttons || [];
  const enableDynamicButtons = selectedNode.data.enableDynamicButtons ?? false;

  /**
   * Переключает режим динамических кнопок.
   * @param {boolean} checked - Состояние переключателя
   */
  const handleDynamicToggle = (checked: boolean) => {
    onNodeUpdate(selectedNode.id, {
      enableDynamicButtons: checked,
      keyboardType: checked ? 'inline' : selectedNode.data.keyboardType,
    });
  };

  /**
   * Обновляет конфигурацию динамических кнопок.
   * @param {DynamicButtonsConfig} config - Новая конфигурация
   */
  const handleDynamicConfigChange = (config: DynamicButtonsConfig) => {
    onNodeUpdate(selectedNode.id, {
      keyboardType: 'inline',
      dynamicButtons: normalizeDynamicButtonsConfig(config),
    });
  };

  /**
   * Дублирует кнопку, вставляя копию сразу после оригинала
   * @param nodeId - ID узла
   * @param button - Кнопка для дублирования
   */
  const handleDuplicateButton = (nodeId: string, button: Button) => {
    const newButton = { ...button, id: generateButtonId() };
    const index = buttons.findIndex((b: Button) => b.id === button.id);
    const updated = [...buttons];
    updated.splice(index + 1, 0, newButton);
    onNodeUpdate(nodeId, { buttons: updated });
  };

  return (
    <div className="space-y-4 p-4">
      <KeyboardTypeSelector selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} isDynamicMode={enableDynamicButtons} />
      {!enableDynamicButtons && (
        <MultipleSelectionSettings selectedNode={selectedNode} keyboardType={selectedNode.data.keyboardType as 'inline' | 'reply'} onNodeUpdate={onNodeUpdate} />
      )}

      {/* Переключатель динамических кнопок */}
      <div className="flex items-center justify-between rounded-lg border border-amber-200/40 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/20 p-3">
        <div className="flex items-center gap-2">
          <i className="fas fa-bolt text-amber-500 text-xs" />
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Генерировать кнопки из HTTP-ответа</span>
        </div>
        <Switch
          checked={enableDynamicButtons}
          onCheckedChange={handleDynamicToggle}
        />
      </div>

      {/* Секция динамических кнопок */}
      {enableDynamicButtons && (
        <DynamicButtonsSection
          config={selectedNode.data.dynamicButtons}
          textVariables={textVariables}
          onChange={handleDynamicConfigChange}
        />
      )}

      {enableDynamicButtons ? (
        <>
          {/* Подсказка: статические кнопки добавляются после динамических */}
          <div className="rounded-lg border border-dashed border-amber-300/60 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-100">
            Динамические кнопки генерируются из HTTP-ответа. Статические кнопки ниже добавляются после них.
          </div>
          <KeyboardButtonsSection selectedNode={selectedNode} onButtonAdd={onButtonAdd} />
          {buttons.map((button: any) => (
            <ButtonCard
              key={button.id}
              nodeId={selectedNode.id}
              button={button}
              textVariables={textVariables}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              onButtonUpdate={onButtonUpdate}
              onButtonDelete={onButtonDelete}
              onButtonDuplicate={handleDuplicateButton}
              selectedNode={selectedNode}
              keyboardType={selectedNode.data.keyboardType as string}
            />
          ))}
        </>
      ) : (
        <>
          <KeyboardButtonsSection selectedNode={selectedNode} onButtonAdd={onButtonAdd} />
          {buttons.map((button: any) => (
            <ButtonCard
              key={button.id}
              nodeId={selectedNode.id}
              button={button}
              textVariables={textVariables}
              getAllNodesFromAllSheets={getAllNodesFromAllSheets}
              onButtonUpdate={onButtonUpdate}
              onButtonDelete={onButtonDelete}
              onButtonDuplicate={handleDuplicateButton}
              selectedNode={selectedNode}
              keyboardType={selectedNode.data.keyboardType as string}
            />
          ))}
          {buttons.length > 0 && (
            <KeyboardLayoutEditor
              buttons={buttons}
              initialLayout={selectedNode.data.keyboardLayout}
              onLayoutChange={(layout) => onNodeUpdate(selectedNode.id, { keyboardLayout: layout })}
            />
          )}
        </>
      )}
    </div>
  );
}
