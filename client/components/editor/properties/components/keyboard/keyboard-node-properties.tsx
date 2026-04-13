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
import {
  DYNAMIC_BUTTONS_PLACEHOLDER_ID,
  createLayoutWithDynamic,
  layoutHasDynamic,
} from '../../utils/keyboard-layout-utils';
import { Switch } from '@/components/ui/switch';
import { generateButtonId } from '@/utils/generate-button-id';
import React from 'react';

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
   * Виртуальная кнопка-заглушка для блока динамических кнопок.
   * Добавляется в массив кнопок только для отображения в редакторе раскладки.
   */
  const dynamicPlaceholderButton: Button = {
    id: DYNAMIC_BUTTONS_PLACEHOLDER_ID,
    text: '⚡ Динамические кнопки',
    action: 'goto',
    target: '',
  } as any;

  /**
   * Массив кнопок для передачи в KeyboardLayoutEditor.
   * В режиме динамических кнопок добавляет виртуальную кнопку __dynamic__.
   */
  const buttonsForLayout: Button[] = enableDynamicButtons
    ? [dynamicPlaceholderButton, ...buttons]
    : buttons;

  /**
   * Раскладка с учётом блока динамических кнопок.
   * Если раскладка ещё не содержит __dynamic__ — создаёт её с динамическим блоком после статических.
   */
  const layoutForDynamic = React.useMemo(() => {
    if (!enableDynamicButtons || buttons.length === 0) return selectedNode.data.keyboardLayout;
    const existing = selectedNode.data.keyboardLayout;
    if (existing && layoutHasDynamic(existing)) return existing;
    return createLayoutWithDynamic(buttons, 1, 'before');
  }, [enableDynamicButtons, buttons, selectedNode.data.keyboardLayout]);

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
          {/* Подсказка: статические кнопки можно перетаскивать относительно динамических */}
          <div className="rounded-lg border border-dashed border-amber-300/60 dark:border-amber-700/50 bg-amber-50/40 dark:bg-amber-950/20 p-3 text-xs text-amber-900 dark:text-amber-100">
            Динамические кнопки генерируются из HTTP-ответа. Перетащите блок ⚡ для изменения порядка.
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
          {buttons.length > 0 && (
            <KeyboardLayoutEditor
              buttons={buttonsForLayout}
              initialLayout={layoutForDynamic}
              dynamicButtonsConfig={selectedNode.data.dynamicButtons}
              onLayoutChange={(layout) => onNodeUpdate(selectedNode.id, { keyboardLayout: layout })}
            />
          )}
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
