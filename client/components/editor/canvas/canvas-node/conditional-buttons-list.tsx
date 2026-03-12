/**
 * @fileoverview Компонент списка кнопок условного сообщения
 * 
 * Отображает кнопки условия с поддержкой inline и reply клавиатур,
 * а также превью переходов к узлам.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента ConditionalButtonsList
 *
 * @interface ConditionalButtonsListProps
 * @property {any[]} buttons - Массив кнопок
 * @property {string} keyboardType - Тип клавиатуры (inline/reply)
 * @property {Node[]} [allNodes] - Все узлы для поиска целевых
 */
interface ConditionalButtonsListProps {
  buttons: any[];
  keyboardType: 'inline' | 'reply';
  allNodes?: Node[];
}

/**
 * Компонент списка кнопок условного сообщения
 *
 * @component
 * @description Отображает кнопки условия
 *
 * @param {ConditionalButtonsListProps} props - Свойства компонента
 * @param {any[]} props.buttons - Массив кнопок
 * @param {string} props.keyboardType - Тип клавиатуры
 * @param {Node[]} [props.allNodes] - Все узлы
 *
 * @returns {JSX.Element} Компонент списка кнопок
 */
export function ConditionalButtonsList({ buttons, keyboardType, allNodes }: ConditionalButtonsListProps) {
  const maxVisible = keyboardType === 'inline' ? 4 : 3;
  const visibleButtons = buttons.slice(0, maxVisible);
  const hiddenCount = buttons.length - maxVisible;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center space-x-1 mb-1.5">
        <i className="fas fa-keyboard text-xs text-amber-600 dark:text-amber-400"></i>
        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
          {keyboardType === 'inline' ? 'Inline' : 'Reply'} кнопки
        </span>
      </div>

      {keyboardType === 'inline' ? (
        <div className="grid grid-cols-2 gap-1">
          {visibleButtons.map((button, btnIndex) => {
            const targetNode = button.action === 'goto' && button.target ? allNodes?.find(n => n.id === button.target) : null;
            const targetNodeDisplay = targetNode?.data?.messageText?.slice(0, 20) || targetNode?.data?.command || (button.action === 'goto' ? button.target?.slice(0, 8) : '');
            
            return (
              <div key={button.id || btnIndex} className="flex flex-col p-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded text-xs font-medium text-blue-700 dark:text-blue-300 text-center border border-blue-200/50 dark:border-blue-800/30">
                <div className="truncate">{button.text}</div>
                {button.action === 'goto' && targetNodeDisplay && (
                  <div className="text-[9px] text-blue-600 dark:text-blue-400 truncate mt-0.5">
                    К узлу: {targetNodeDisplay}{targetNodeDisplay.length > 20 ? '...' : ''}
                  </div>
                )}
                {button.action === 'url' && button.url && (
                  <div className="text-[9px] text-purple-600 dark:text-purple-400 truncate mt-0.5">
                    🔗 {button.url}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-1">
          {visibleButtons.map((button, btnIndex) => {
            const targetNode = button.action === 'goto' && button.target ? allNodes?.find(n => n.id === button.target) : null;
            const targetNodeDisplay = targetNode?.data?.messageText?.slice(0, 20) || targetNode?.data?.command || (button.action === 'goto' ? button.target?.slice(0, 8) : '');
            
            return (
              <div key={button.id || btnIndex} className="flex flex-col p-1.5 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/30 dark:to-slate-800/30 rounded border border-gray-200/50 dark:border-gray-700/30">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{button.text}</span>
                  <div className="flex items-center space-x-1 ml-1 flex-shrink-0">
                    {button.action === 'goto' && <i className="fas fa-arrow-right text-blue-600 dark:text-blue-400 text-xs opacity-70" title="Переход"></i>}
                    {button.action === 'url' && <i className="fas fa-external-link-alt text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Ссылка"></i>}
                    {button.action === 'selection' && <i className="fas fa-mouse-pointer text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Выбор"></i>}
                    {button.action === 'complete' && <i className="fas fa-flag-checkered text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Завершение"></i>}
                  </div>
                </div>
                {button.action === 'goto' && targetNodeDisplay && (
                  <div className="text-[9px] text-blue-600 dark:text-blue-400 truncate mt-0.5">
                    К узлу: {targetNodeDisplay}{targetNodeDisplay.length > 20 ? '...' : ''}
                  </div>
                )}
                {button.action === 'url' && button.url && (
                  <div className="text-[9px] text-purple-600 dark:text-purple-400 truncate mt-0.5">
                    🔗 {button.url}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hiddenCount > 0 && (
        <div className="text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            +{hiddenCount} еще
          </span>
        </div>
      )}
    </div>
  );
}
