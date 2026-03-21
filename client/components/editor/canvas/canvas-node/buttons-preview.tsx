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
import { OutputPort } from './output-port';
import { PortType } from './port-colors';

/**
 * Интерфейс свойств компонента ButtonsPreview
 *
 * @interface ButtonsPreviewProps
 * @property {Node} node - Узел с кнопками
 * @property {Node[]} [allNodes] - Все узлы для поиска целевых
 * @property {Function} [onPortMouseDown] - Обработчик начала перетаскивания от порта кнопки
 */
interface ButtonsPreviewProps {
  /** Узел с кнопками */
  node: Node;
  /** Все узлы для поиска целевых */
  allNodes?: Node[];
  /** Обработчик начала перетаскивания от порта кнопки */
  onPortMouseDown?: (e: React.MouseEvent, portType: PortType, buttonId?: string, portCenter?: { x: number; y: number }) => void;
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
export function ButtonsPreview({ node, allNodes, onPortMouseDown }: ButtonsPreviewProps) {
  if (!node.data.buttons || node.data.buttons.length === 0 || node.data.keyboardType === 'none') {
    return null;
  }

  const hasOptionButtons = node.data.buttons.some((button: any) => button.action === 'selection');
  const isMultiSelect = hasOptionButtons && (node.data as any).allowMultipleSelection;
  const keyboardType = node.data.keyboardType as 'inline' | 'reply';

  // Находим кнопку завершения (для множественного выбора)
  const completeButton = useMemo(() =>
    isMultiSelect
      ? node.data.buttons.find((button: any) => button.action === 'complete')
      : undefined,
    [isMultiSelect, node.data.buttons]
  );

  // Все кнопки включая кнопку завершения для отображения в сетке
  const allButtonsForGrid = useMemo(() => {
    return node.data.buttons || [];
  }, [node.data.buttons]);

  return (
    <div className="space-y-3 mb-1">
      <ButtonsPreviewHeader isMultiSelect={isMultiSelect} keyboardType={keyboardType} />

      {keyboardType === 'inline' ? (
        <KeyboardGrid
          buttons={allButtonsForGrid}
          keyboardLayout={node.data.keyboardLayout}
          buttonClassName=""
          renderButton={(button) => {
            if (button.action === 'complete') return <DoneButton button={button} />;
            if (button.action === 'selection') return <OptionButton button={button} />;
            return (
              <div className="relative">
                <InlineButton button={button} allNodes={allNodes} />
                {button.action === 'goto' && (
                  <OutputPort portType="button-goto" buttonId={button.id} onPortMouseDown={onPortMouseDown} />
                )}
              </div>
            );
          }}
        />
      ) : (
        <KeyboardGrid
          buttons={node.data.buttons}
          keyboardLayout={node.data.keyboardLayout}
          buttonClassName=""
          renderButton={(button) => (
            <div className="relative">
              <ReplyButton button={button} allNodes={allNodes} />
              {button.action === 'goto' && (
                <OutputPort portType="button-goto" buttonId={button.id} onPortMouseDown={onPortMouseDown} />
              )}
            </div>
          )}
        />
      )}
    </div>
  );
}
