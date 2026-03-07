/**
 * @fileoverview Секция кнопок клавиатуры
 * 
 * Компонент отображает кнопки клавиатуры с возможностью добавления и управления.
 */

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ButtonCard } from '../button-card/button-card';
import type { Node, Button as ButtonType } from '@shared/schema';
import type { ProjectVariable } from '../../utils/variables-utils';

/** Пропсы компонента */
interface KeyboardButtonsSectionProps {
  /** Выбранный узел */
  selectedNode: Node;
  /** Все узлы для навигации */
  getAllNodesFromAllSheets: any[];
  /** Текстовые переменные */
  textVariables: ProjectVariable[];
  /** Функция обновления данных узла */
  onNodeUpdate: (nodeId: string, updates: Partial<any>) => void;
  /** Функция добавления кнопки */
  onButtonAdd: (nodeId: string, button: ButtonType) => void;
  /** Функция обновления кнопки */
  onButtonUpdate: (nodeId: string, buttonId: string, updates: Partial<ButtonType>) => void;
  /** Функция удаления кнопки */
  onButtonDelete: (nodeId: string, buttonId: string) => void;
}

/**
 * Компонент секции кнопок клавиатуры
 * 
 * @param {KeyboardButtonsSectionProps} props - Пропсы компонента
 * @returns {JSX.Element} Секция кнопок клавиатуры
 */
export function KeyboardButtonsSection({
  selectedNode,
  getAllNodesFromAllSheets,
  textVariables,
  onNodeUpdate,
  onButtonAdd,
  onButtonUpdate,
  onButtonDelete
}: KeyboardButtonsSectionProps) {
  const handleAddOptionButton = () => {
    const newButton: ButtonType = {
      id: Date.now().toString(),
      text: 'Новая опция',
      action: 'selection' as const,
      target: '',
      skipDataCollection: false,
      hideAfterClick: false
    };
    const currentButtons = selectedNode.data.buttons || [];
    const updatedButtons = [...currentButtons, newButton];
    onNodeUpdate(selectedNode.id, { buttons: updatedButtons });
  };

  const handleAddCompleteButton = () => {
    const newButton: ButtonType = {
      id: Date.now().toString(),
      text: 'Готово',
      action: 'complete' as const,
      target: '',
      skipDataCollection: false,
      hideAfterClick: false
    };
    const currentButtons = selectedNode.data.buttons || [];
    const updatedButtons = [...currentButtons, newButton];
    onNodeUpdate(selectedNode.id, { buttons: updatedButtons });
  };

  return (
    <div className="space-y-3">
      <div className="border-t border-border/20 pt-4"></div>
      <div className="flex flex-col gap-2.5 sm:gap-3 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-50/40 to-amber-50/30 dark:from-orange-950/20 dark:to-amber-950/10 border border-orange-200/40 dark:border-orange-800/30 hover:border-orange-300/60 dark:hover:border-orange-700/60 hover:bg-orange-50/60 dark:hover:bg-orange-950/30 transition-all duration-200 group">
        <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className="w-6 sm:w-7 md:w-8 h-6 sm:h-7 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-orange-200/50 dark:bg-orange-900/40 group-hover:bg-orange-300/50 dark:group-hover:bg-orange-800/50 transition-all">
            <i className="fas fa-square-plus text-xs sm:text-sm text-orange-600 dark:text-orange-400"></i>
          </div>
          <div className="min-w-0">
            <Label className="text-xs sm:text-sm font-semibold text-orange-900 dark:text-orange-100 cursor-pointer block">
              Кнопки
            </Label>
            <div className="text-xs text-orange-700/70 dark:text-orange-300/70 leading-snug">
              Добавляйте и управляйте кнопками
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onButtonAdd(selectedNode.id, {
              id: Date.now().toString(),
              text: 'Новая кнопка',
              action: 'goto',
              target: '',
              skipDataCollection: false,
              hideAfterClick: false
            })}
            className="text-xs font-medium h-8 px-2 border-orange-300/50 dark:border-orange-700/50 text-orange-700 dark:text-orange-300 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-all"
          >
            <i className="fas fa-plus text-xs mr-1.5"></i>
            <span className="hidden sm:inline">Кнопка</span>
          </Button>
          {selectedNode.data.allowMultipleSelection && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddOptionButton}
                className="text-xs font-medium h-8 px-2 border-green-300/50 dark:border-green-700/50 text-green-700 dark:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-all"
              >
                <i className="fas fa-check text-xs mr-1.5"></i>
                <span className="hidden sm:inline">Опция</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleAddCompleteButton}
                className="text-xs font-medium h-8 px-2 border-purple-300/50 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-all"
              >
                <i className="fas fa-flag-checkered text-xs mr-1.5"></i>
                <span className="hidden sm:inline">Завершение</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {(selectedNode.data.buttons || []).map((button) => (
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
      </div>
    </div>
  );
}
