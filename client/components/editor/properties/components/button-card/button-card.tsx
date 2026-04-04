/**
 * @fileoverview Карточка кнопки
 *
 * Основной компонент карточки кнопки, объединяющий все подкомпоненты.
 * Корневой div помечается атрибутом data-button-id для скролла из панели свойств.
 */

import { Input } from '@/components/ui/input';
import { ButtonTextField } from './button-text-field';
import { ButtonActionSelector } from './button-action-selector';
import { ButtonCallbackField } from './button-callback-field';
import { ButtonHideAfterClickToggle } from './button-hide-after-click-toggle';
import { GotoTargetSection } from '../navigation/goto-target-section';
import type { Button } from '@shared/schema';
import type { ProjectVariable } from '../../utils/variables-utils';
import type { Node } from '@shared/schema';

/** Пропсы карточки кнопки */
interface ButtonCardProps {
  /** ID узла */
  nodeId: string;
  /** Объект кнопки */
  button: Button;
  /** Текстовые переменные */
  textVariables: ProjectVariable[];
  /** Все узлы для навигации */
  getAllNodesFromAllSheets: any[];
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** Функция удаления кнопки */
  onButtonDelete: (nodeId: string, buttonId: string) => void;
  /** Функция дублирования кнопки */
  onButtonDuplicate: (nodeId: string, button: Button) => void;
  /** Выбранный узел */
  selectedNode: Node;
  /** Тип клавиатуры (inline/reply/none) */
  keyboardType?: string;
}

/**
 * Компонент карточки кнопки
 * 
 * @param {ButtonCardProps} props - Пропсы компонента
 * @returns {JSX.Element} Карточка кнопки
 */
export function ButtonCard({
  nodeId,
  button,
  textVariables,
  getAllNodesFromAllSheets,
  onButtonUpdate,
  onButtonDelete,
  onButtonDuplicate,
  selectedNode,
  keyboardType,
}: ButtonCardProps) {
  return (
    <div
      className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group"
      data-button-id={button.id}
    >
      <ButtonTextField
        nodeId={nodeId}
        button={button}
        textVariables={textVariables}
        onButtonUpdate={onButtonUpdate}
        onDelete={() => onButtonDelete(nodeId, button.id)}
        onDuplicate={() => onButtonDuplicate(nodeId, button)}
      />

      <div className="border-t border-border/20 my-3"></div>

      <ButtonActionSelector
        nodeId={nodeId}
        button={button}
        onButtonUpdate={onButtonUpdate}
        allowMultipleSelection={selectedNode.data.allowMultipleSelection ?? false}
        keyboardType={keyboardType}
      />

      {button.action === 'goto' && (
        <>
          <div className="border-t border-border/20 my-3"></div>
          <GotoTargetSection
            selectedNode={selectedNode}
            button={button}
            getAllNodesFromAllSheets={getAllNodesFromAllSheets}
            onButtonUpdate={onButtonUpdate}
          />
        </>
      )}

      {!['url', 'contact', 'location'].includes(button.action) && (
        <>
          <div className="border-t border-border/20 my-3"></div>
          <ButtonCallbackField
            nodeId={nodeId}
            button={button}
            keyboardType={keyboardType}
            onButtonUpdate={onButtonUpdate}
          />
        </>
      )}

      {button.action === 'url' && (
        <>
          <div className="border-t border-border/20 my-3"></div>
          <Input
            value={button.url || ''}
            onChange={(e) => onButtonUpdate(nodeId, button.id, { url: e.target.value })}
            className="text-xs sm:text-sm bg-white/60 dark:bg-slate-950/60 border border-blue-300/40 dark:border-blue-700/40 text-blue-900 dark:text-blue-50 placeholder:text-blue-500/50 dark:placeholder:text-blue-400/50 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/30 rounded-lg"
            placeholder="https://example.com"
          />
        </>
      )}

      <div className="border-t border-border/20 my-3"></div>
      <ButtonHideAfterClickToggle
        nodeId={nodeId}
        button={button}
        onButtonUpdate={onButtonUpdate}
        keyboardType={keyboardType as 'inline' | 'reply' | 'none' | undefined}
      />
    </div>
  );
}
