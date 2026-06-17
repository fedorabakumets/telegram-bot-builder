/**
 * @fileoverview Разрешение параметров превью клавиатуры на холсте
 * @module components/editor/canvas/utils/resolve-keyboard-preview-buttons
 */

import { Node } from '@/types/bot';
import { KeyboardLayout } from '@/components/editor/properties/types/keyboard-layout';
import {
  buildDynamicButtonsPreviewItems,
  normalizeDynamicButtonsConfig,
} from '@/components/editor/properties/utils/dynamic-buttons';

/** Параметры превью клавиатуры для холста */
export interface KeyboardPreviewParams {
  /** Кнопки для отображения в превью */
  previewButtons: { id: string }[];
  /** Тип клавиатуры с учётом dynamic mode */
  effectiveKeyboardType: 'inline' | 'reply' | 'none';
  /** Раскладка для KeyboardGrid */
  keyboardLayout?: KeyboardLayout;
  /** Количество колонок по умолчанию */
  defaultColumns: number;
}

/**
 * Собирает список кнопок и раскладку для превью клавиатуры на холсте.
 *
 * @param node - Узел message или keyboard
 * @returns Параметры превью или `null`, если клавиатура не отображается
 */
export function resolveKeyboardPreviewParams(node: Node): KeyboardPreviewParams | null {
  const keyboardType = node.data.keyboardType as 'inline' | 'reply' | 'none';
  const enableDynamicButtons = (node.data as any).enableDynamicButtons ?? false;
  const dynamicButtons = enableDynamicButtons
    ? normalizeDynamicButtonsConfig((node.data as any).dynamicButtons)
    : null;
  const effectiveKeyboardType = enableDynamicButtons ? 'inline' : keyboardType;

  const staticButtons = node.data.buttons || [];
  const keyboardLayout = (node.data as any).keyboardLayout as KeyboardLayout | undefined;

  let previewButtons: { id: string }[];

  if (enableDynamicButtons) {
    const dynamicItems = buildDynamicButtonsPreviewItems(dynamicButtons);
    if (staticButtons.length === 0) {
      previewButtons = dynamicItems;
    } else if (keyboardLayout?.rows?.length) {
      const DYNAMIC_ID = '__dynamic__';
      const dynamicRowIdx = keyboardLayout.rows.findIndex(
        (row) => Array.isArray(row.buttonIds) && row.buttonIds.includes(DYNAMIC_ID),
      );

      if (dynamicRowIdx !== -1) {
        const btnMap = new Map(staticButtons.map((button: any) => [button.id, button]));
        const before: { id: string }[] = [];
        const after: { id: string }[] = [];

        for (let i = 0; i < keyboardLayout.rows.length; i++) {
          const row = keyboardLayout.rows[i];
          if (!Array.isArray(row.buttonIds)) continue;
          for (const id of row.buttonIds) {
            if (id === DYNAMIC_ID) continue;
            const btn = btnMap.get(id);
            if (btn) (i < dynamicRowIdx ? before : after).push(btn);
          }
        }

        previewButtons = [...before, ...dynamicItems, ...after];
      } else {
        previewButtons = [...dynamicItems, ...staticButtons];
      }
    } else {
      previewButtons = [...dynamicItems, ...staticButtons];
    }
  } else {
    previewButtons = staticButtons;
  }

  if (previewButtons.length === 0 || effectiveKeyboardType === 'none') {
    return null;
  }

  return {
    previewButtons,
    effectiveKeyboardType,
    keyboardLayout: enableDynamicButtons ? undefined : keyboardLayout,
    defaultColumns: enableDynamicButtons ? dynamicButtons?.columns ?? 2 : 2,
  };
}
