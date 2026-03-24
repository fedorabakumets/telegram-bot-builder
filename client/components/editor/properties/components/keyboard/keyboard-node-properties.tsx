/**
 * @fileoverview Панель свойств отдельного узла клавиатуры
 * Показывает настройки кнопок, типа клавиатуры и раскладки.
 * @module components/editor/properties/components/keyboard/keyboard-node-properties
 */

import { Node } from '@shared/schema';
import { ButtonCard } from '../button-card/button-card';
import { KeyboardButtonsSection } from './keyboard-buttons-section';
import { KeyboardTypeSelector } from './keyboard-type-selector';
import { KeyboardLayoutEditor } from './keyboard-layout-editor';
import { MultipleSelectionSettings } from '../questions/multiple-selection-settings';
import type { ProjectVariable } from '../../utils/variables-utils';

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

  return (
    <div className="space-y-4 p-4">
      <KeyboardTypeSelector selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} />
      <MultipleSelectionSettings selectedNode={selectedNode} keyboardType={selectedNode.data.keyboardType as 'inline' | 'reply'} onNodeUpdate={onNodeUpdate} />
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
          selectedNode={selectedNode}
        />
      ))}
      {buttons.length > 0 && (
        <KeyboardLayoutEditor
          buttons={buttons}
          initialLayout={selectedNode.data.keyboardLayout}
          onLayoutChange={(layout) => onNodeUpdate(selectedNode.id, { keyboardLayout: layout })}
        />
      )}
    </div>
  );
}
