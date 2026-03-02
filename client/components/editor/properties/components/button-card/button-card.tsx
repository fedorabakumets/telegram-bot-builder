/**
 * @fileoverview Карточка кнопки
 * 
 * Основной компонент карточки кнопки, объединяющий все подкомпоненты.
 */

import { ButtonTextField } from './button-text-field';
import { ButtonActionSelector } from './button-action-selector';
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
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<Button>) => void;
  /** Функция удаления кнопки */
  onButtonDelete: (nodeId: string, buttonId: string) => void;
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
  onButtonUpdate,
  onButtonDelete
}: ButtonCardProps) {
  return (
    <div className="space-y-2.5 sm:space-y-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-50/40 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10 border border-blue-200/40 dark:border-blue-800/30 hover:border-blue-300/60 dark:hover:border-blue-700/60 hover:bg-blue-50/60 dark:hover:bg-blue-950/30 transition-all duration-200 group">
      <ButtonTextField
        nodeId={nodeId}
        button={button}
        textVariables={textVariables}
        onButtonUpdate={onButtonUpdate}
        onDelete={() => onButtonDelete(nodeId, button.id)}
      />

      <div className="border-t border-border/20 my-3"></div>

      <ButtonActionSelector
        nodeId={nodeId}
        button={button}
        onButtonUpdate={onButtonUpdate}
      />
    </div>
  );
}
