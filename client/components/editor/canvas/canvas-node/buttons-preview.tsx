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

  return (
    <div className="space-y-3">
      <ButtonsPreviewHeader isMultiSelect={isMultiSelect} keyboardType={keyboardType} />

      {keyboardType === 'inline' ? (
        <div className="space-y-3">
          {isMultiSelect ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {node.data.buttons
                  .filter((button: any) => button.buttonType === 'option')
                  .map((button: any) => (
                    <OptionButton key={button.id} button={button} />
                  ))}
              </div>
              <DoneButton />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {node.data.buttons.map((button: any) => (
                <InlineButton key={button.id} button={button} allNodes={allNodes} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {node.data.buttons.map((button: any) => (
            <ReplyButton key={button.id} button={button} allNodes={allNodes} />
          ))}
        </div>
      )}
    </div>
  );
}
