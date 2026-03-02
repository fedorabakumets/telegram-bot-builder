/**
 * @fileoverview Карточка кнопки
 * 
 * Основной компонент карточки кнопки, объединяющий все подкомпоненты.
 */

import { Input } from '@/components/ui/input';
import { ButtonCardHeader } from './button-card-header';
import { ButtonTextField } from './button-text-field';
import { ButtonTypeSelectorCard } from './button-type-selector-card';
import { ButtonActionSelector } from './button-action-selector';
import { ButtonSkipDataToggle } from './button-skip-data-toggle';
import { ButtonHideAfterClickToggle } from './button-hide-after-click-toggle';
import { GotoTargetSection } from '../navigation/goto-target-section';
import { CommandTargetSection } from '../commands/command-target-section';
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
  /** Тип клавиатуры */
  keyboardType?: 'inline' | 'reply' | 'none';
  /** Флаг множественного выбора */
  allowMultipleSelection?: boolean;
  /** Флаг сбора пользовательского ввода */
  collectUserInput?: boolean;
  /** Выбранный узел для передачи в CommandTargetSection и GotoTargetSection */
  selectedNode: Node;
  /** Все узлы проекта */
  allNodes: Node[];
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
  keyboardType,
  allowMultipleSelection,
  collectUserInput,
  selectedNode,
  allNodes
}: ButtonCardProps) {
  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group">
      <ButtonCardHeader
        button={button}
        allowMultipleSelection={allowMultipleSelection}
        onDelete={() => onButtonDelete(nodeId, button.id)}
        nodeId={nodeId}
        onButtonUpdate={onButtonUpdate}
      />

      <div className="border-t border-border/20 my-3"></div>

      <ButtonTextField
        nodeId={nodeId}
        button={button}
        textVariables={textVariables}
        onButtonUpdate={onButtonUpdate}
      />

      <div className="border-t border-border/20 my-3"></div>

      {allowMultipleSelection && (
        <ButtonTypeSelectorCard
          nodeId={nodeId}
          button={button}
          onButtonUpdate={onButtonUpdate}
        />
      )}

      {(!allowMultipleSelection || (button.buttonType !== 'option' && button.buttonType !== 'complete')) && (
        <ButtonActionSelector
          nodeId={nodeId}
          button={button}
          onButtonUpdate={onButtonUpdate}
        />
      )}

      <ButtonSkipDataToggle
        nodeId={nodeId}
        button={button}
        onButtonUpdate={onButtonUpdate}
        collectUserInput={collectUserInput}
      />

      <ButtonHideAfterClickToggle
        nodeId={nodeId}
        button={button}
        onButtonUpdate={onButtonUpdate}
        keyboardType={keyboardType}
      />

      {(!allowMultipleSelection || button.action !== 'selection') && button.action === 'url' && (
        <Input
          value={button.url || ''}
          onChange={(e) => onButtonUpdate(nodeId, button.id, { url: e.target.value })}
          className="mt-2 text-xs"
          placeholder="https://example.com"
        />
      )}

      {(!allowMultipleSelection || button.action !== 'selection') && button.action === 'command' && (
        <CommandTargetSection
          selectedNode={selectedNode}
          button={button}
          allNodes={allNodes}
          onButtonUpdate={onButtonUpdate}
        />
      )}

      {(!allowMultipleSelection || button.action !== 'selection') && button.action === 'goto' && (
        <GotoTargetSection
          selectedNode={selectedNode}
          button={button}
          getAllNodesFromAllSheets={getAllNodesFromAllSheets}
          onButtonUpdate={onButtonUpdate}
        />
      )}
    </div>
  );
}
