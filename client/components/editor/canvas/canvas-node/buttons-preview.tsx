/**
 * @fileoverview Компонент превью кнопок
 *
 * Отображает превью кнопок узла с поддержкой inline/reply клавиатур,
 * множественного выбора и различных типов действий.
 */

import { Node } from '@/types/bot';
import { ButtonsPreviewHeader } from './buttons-preview-header';
import { InlineButton } from './inline-button';
import { ReplyButton } from './reply-button';
import { OptionButton } from './option-button';
import { DoneButton } from './done-button';
import { KeyboardGrid } from '../keyboard-grid';
import { useMemo } from 'react';

/**
 * Интерфейс свойств компонента ButtonsPreview
 *
 * @interface ButtonsPreviewProps
 * @property {Node} node - Узел с кнопками
 * @property {Node[]} [allNodes] - Все узлы для поиска целевых
 */
interface ButtonsPreviewProps {
  node: Node;
  allNodes?: Node[];
}

/**
 * Компонент превью кнопок
 *
 * @component
 * @description Отображает превью кнопок узла
 *
 * @param {ButtonsPreviewProps} props - Свойства компонента
 * @param {Node} props.node - Узел с кнопками
 * @param {Node[]} [props.allNodes] - Все узлы
 *
 * @returns {JSX.Element | null} Компонент превью или null если нет кнопок
 */
export function ButtonsPreview({ node, allNodes }: ButtonsPreviewProps) {
  if (!node.data.buttons || node.data.buttons.length === 0 || node.data.keyboardType === 'none') {
    return null;
  }

  const hasOptionButtons = node.data.buttons.some((button: any) => button.buttonType === 'option');
  const isMultiSelect = hasOptionButtons && (node.data as any).allowMultipleSelection;
  const keyboardType = node.data.keyboardType as 'inline' | 'reply';

  // Находим кнопку завершения (для множественного выбора)
  // Только кнопка с buttonType: 'complete' считается кнопкой завершения
  const completeButton = useMemo(() => 
    isMultiSelect
      ? node.data.buttons.find((button: any) => button.buttonType === 'complete')
      : undefined,
    [isMultiSelect, node.data.buttons]
  );

  // Проверяем, есть ли done-button в keyboardLayout
  const hasDoneButtonInLayout = useMemo(() => {
    const rows = node.data.keyboardLayout?.rows;
    if (!rows) return false;
    return rows.some((row: any) => row.buttonIds.includes('done-button'));
  }, [node.data.keyboardLayout?.rows]);

  // Если done-button есть в layout, добавляем виртуальную кнопку в массив для отображения
  const allButtonsForGrid = useMemo(() => {
    const buttons = [...node.data.buttons];
    if (isMultiSelect && !completeButton && hasDoneButtonInLayout) {
      buttons.push({
        id: 'done-button',
        text: '✅ Готово',
        action: 'goto',
        target: node.data.continueButtonTarget || '',
        buttonType: 'complete' as const,
        skipDataCollection: false,
        hideAfterClick: false
      } as any);
    }
    return buttons;
  }, [node.data.buttons, node.data.keyboardLayout, isMultiSelect, completeButton, hasDoneButtonInLayout, node.data.continueButtonTarget]);

  return (
    <div className="space-y-3">
      <ButtonsPreviewHeader isMultiSelect={isMultiSelect} keyboardType={keyboardType} />

      {keyboardType === 'inline' ? (
        <div className="space-y-3">
          {isMultiSelect ? (
            <>
              {hasDoneButtonInLayout ? (
                // Если done-button в layout, показываем все кнопки в сетке
                <KeyboardGrid
                  buttons={allButtonsForGrid}
                  keyboardLayout={node.data.keyboardLayout}
                  buttonClassName=""
                  renderButton={(button) => button.buttonType === 'option' ? <OptionButton button={button} /> : <InlineButton button={button} allNodes={allNodes} />}
                />
              ) : (
                // Старая логика: кнопка завершения отдельно
                <>
                  <KeyboardGrid
                    buttons={allButtonsForGrid.filter((button: any) => button.buttonType !== 'complete')}
                    keyboardLayout={node.data.keyboardLayout}
                    buttonClassName=""
                    renderButton={(button) => button.buttonType === 'option' ? <OptionButton button={button} /> : <InlineButton button={button} allNodes={allNodes} />}
                  />
                  {/* Кнопка завершения: из шаблона или стандартная */}
                  {completeButton ? (
                    <InlineButton button={completeButton} allNodes={allNodes} />
                  ) : (
                    <DoneButton />
                  )}
                </>
              )}
            </>
          ) : (
            <KeyboardGrid
              buttons={node.data.buttons}
              keyboardLayout={node.data.keyboardLayout}
              buttonClassName=""
              renderButton={(button) => <InlineButton button={button} allNodes={allNodes} />}
            />
          )}
        </div>
      ) : (
        <KeyboardGrid
          buttons={node.data.buttons}
          keyboardLayout={node.data.keyboardLayout}
          buttonClassName=""
          renderButton={(button) => <ReplyButton button={button} allNodes={allNodes} />}
        />
      )}
    </div>
  );
}
