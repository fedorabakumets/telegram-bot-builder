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
import {
  ensureInvoicePayButton,
  isKeyboardBoundToInvoice,
} from '../../utils/invoice-pay-button';
import { lockInvoicePayInLayout } from '../../utils/lock-invoice-pay-layout';
import type { ButtonActionType } from '../button-card/button-action-options';
import type { KeyboardLayout } from '../../types/keyboard-layout';

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

/** Действия кнопок у клавиатуры счёта (без pay — он только у первой) */
const INVOICE_OTHER_ACTIONS: ButtonActionType[] = [
  'goto', 'url', 'default', 'copy_text', 'web_app', 'command',
];

/**
 * Панель свойств узла клавиатуры.
 * @param props - Пропсы панели
 * @returns Содержимое панели клавиатуры
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
  const isInvoiceKb = isKeyboardBoundToInvoice(selectedNode.id, getAllNodesFromAllSheets);
  const rawButtons = selectedNode.data.buttons || [];
  const buttons = isInvoiceKb ? ensureInvoicePayButton(rawButtons) : rawButtons;
  const enableDynamicButtons = selectedNode.data.enableDynamicButtons ?? false;

  React.useEffect(() => {
    if (!isInvoiceKb) return;
    const next = ensureInvoicePayButton(selectedNode.data.buttons);
    const same =
      next.length === (selectedNode.data.buttons || []).length
      && next.every((b, i) => b.id === (selectedNode.data.buttons || [])[i]?.id
        && b.action === (selectedNode.data.buttons || [])[i]?.action);
    if (!same || selectedNode.data.keyboardType !== 'inline') {
      onNodeUpdate(selectedNode.id, { buttons: next, keyboardType: 'inline' });
    }
  }, [isInvoiceKb, selectedNode.id, selectedNode.data.buttons, selectedNode.data.keyboardType, onNodeUpdate]);

  const dynamicPlaceholderButton: Button = {
    id: DYNAMIC_BUTTONS_PLACEHOLDER_ID,
    text: '⚡ Динамические кнопки',
    action: 'goto',
    target: '',
  } as any;

  const buttonsForLayout: Button[] = enableDynamicButtons
    ? [dynamicPlaceholderButton, ...buttons]
    : buttons;

  const layoutForDynamic = React.useMemo(() => {
    if (!enableDynamicButtons || buttons.length === 0) return selectedNode.data.keyboardLayout;
    const existing = selectedNode.data.keyboardLayout;
    if (existing && layoutHasDynamic(existing)) return existing;
    return createLayoutWithDynamic(buttons, 1, 'before');
  }, [enableDynamicButtons, buttons, selectedNode.data.keyboardLayout]);

  const handleDynamicToggle = (checked: boolean) => {
    if (isInvoiceKb && checked) return;
    onNodeUpdate(selectedNode.id, {
      enableDynamicButtons: checked,
      keyboardType: checked ? 'inline' : selectedNode.data.keyboardType,
    });
  };

  const handleDynamicConfigChange = (config: DynamicButtonsConfig) => {
    onNodeUpdate(selectedNode.id, {
      keyboardType: 'inline',
      dynamicButtons: normalizeDynamicButtonsConfig(config),
    });
  };

  const handleDuplicateButton = (nodeId: string, button: Button) => {
    if (button.action === 'pay') return;
    const newButton = { ...button, id: generateButtonId(), action: button.action === 'pay' ? 'goto' : button.action };
    const index = buttons.findIndex((b: Button) => b.id === button.id);
    const updated = [...buttons];
    updated.splice(index + 1, 0, newButton);
    onNodeUpdate(nodeId, { buttons: updated });
  };

  const handleDeleteButton = (nodeId: string, buttonId: string) => {
    const btn = buttons.find((b: Button) => b.id === buttonId);
    if (btn?.action === 'pay') return;
    onButtonDelete(nodeId, buttonId);
  };

  const handleButtonUpdate = (nodeId: string, buttonId: string, updates: any) => {
    const btn = buttons.find((b: Button) => b.id === buttonId);
    if (btn?.action === 'pay' && updates.action && updates.action !== 'pay') return;
    onButtonUpdate(nodeId, buttonId, updates);
  };

  const handleLayoutChange = (layout: KeyboardLayout) => {
    const payId = buttons.find((b: Button) => b.action === 'pay')?.id;
    const next = isInvoiceKb && payId ? lockInvoicePayInLayout(layout, payId) : layout;
    onNodeUpdate(selectedNode.id, { keyboardLayout: next });
  };

  const renderButtonCards = () =>
    buttons.map((button: any) => (
      <ButtonCard
        key={button.id}
        nodeId={selectedNode.id}
        button={button}
        textVariables={textVariables}
        getAllNodesFromAllSheets={getAllNodesFromAllSheets}
        onButtonUpdate={handleButtonUpdate}
        onButtonDelete={handleDeleteButton}
        onButtonDuplicate={handleDuplicateButton}
        selectedNode={selectedNode}
        keyboardType={selectedNode.data.keyboardType as string}
        allowedActions={
          button.action === 'pay'
            ? (['pay'] as ButtonActionType[])
            : isInvoiceKb
              ? INVOICE_OTHER_ACTIONS
              : undefined
        }
        lockPayButton={button.action === 'pay'}
        hideExtras={button.action === 'pay'}
      />
    ));

  return (
    <div className="space-y-4 p-4">
      {isInvoiceKb && (
        <div className="rounded-lg border border-yellow-300/60 dark:border-yellow-700/50 bg-yellow-50/50 dark:bg-yellow-950/20 p-3 text-xs text-yellow-900 dark:text-yellow-100">
          У счёта первая кнопка всегда «Оплатить» (правило Telegram). Её нельзя удалить или переставить.
          Слово со звездой в тексте Telegram заменит на значок ⭐. Клавиатура только под сообщением (inline).
        </div>
      )}
      <KeyboardTypeSelector
        selectedNode={selectedNode}
        onNodeUpdate={onNodeUpdate}
        isDynamicMode={enableDynamicButtons || isInvoiceKb}
        forceInline={isInvoiceKb}
      />
      {!enableDynamicButtons && !isInvoiceKb && (
        <MultipleSelectionSettings selectedNode={selectedNode} keyboardType={selectedNode.data.keyboardType as 'inline' | 'reply'} onNodeUpdate={onNodeUpdate} />
      )}

      {!isInvoiceKb && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200/40 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/20 p-3">
          <div className="flex items-center gap-2">
            <i className="fas fa-bolt text-amber-500 text-xs" />
            <span className="text-sm font-medium text-amber-900 dark:text-amber-100">Генерировать кнопки из HTTP-ответа</span>
          </div>
          <Switch checked={enableDynamicButtons} onCheckedChange={handleDynamicToggle} />
        </div>
      )}

      {enableDynamicButtons && !isInvoiceKb && (
        <DynamicButtonsSection
          config={selectedNode.data.dynamicButtons}
          textVariables={textVariables}
          onChange={handleDynamicConfigChange}
        />
      )}

      <KeyboardButtonsSection selectedNode={selectedNode} onButtonAdd={onButtonAdd} />
      {renderButtonCards()}
      {buttons.length > 0 && (
        <KeyboardLayoutEditor
          buttons={enableDynamicButtons && !isInvoiceKb ? buttonsForLayout : buttons}
          initialLayout={enableDynamicButtons && !isInvoiceKb ? layoutForDynamic : selectedNode.data.keyboardLayout}
          dynamicButtonsConfig={enableDynamicButtons ? selectedNode.data.dynamicButtons : undefined}
          onLayoutChange={handleLayoutChange}
        />
      )}
      {selectedNode.data.keyboardType === 'inline' && buttons.length > 1 && !isInvoiceKb && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/30 dark:border-amber-800/30">
          <label htmlFor="shuffleButtons" className="text-xs font-medium text-amber-800 dark:text-amber-200 cursor-pointer">
            🔀 Перемешивать кнопки
          </label>
          <Switch
            id="shuffleButtons"
            checked={selectedNode.data.shuffleButtons || false}
            onCheckedChange={(checked) => onNodeUpdate(selectedNode.id, { shuffleButtons: checked })}
          />
        </div>
      )}
    </div>
  );
}
