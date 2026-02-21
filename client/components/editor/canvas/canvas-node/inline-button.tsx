/**
 * @fileoverview Компонент inline кнопки
 * 
 * Отображает отдельную inline кнопку с информацией о действии
 * и превью перехода к узлу или ссылки.
 */

import { Node } from '@/types/bot';

/**
 * Интерфейс свойств компонента InlineButton
 *
 * @interface InlineButtonProps
 * @property {any} button - Объект кнопки
 * @property {Node[]} [allNodes] - Все узлы для поиска целевых
 */
interface InlineButtonProps {
  button: any;
  allNodes?: Node[];
}

/**
 * Компонент inline кнопки
 *
 * @component
 * @description Отображает inline кнопку
 *
 * @param {InlineButtonProps} props - Свойства компонента
 * @param {any} props.button - Объект кнопки
 * @param {Node[]} [props.allNodes] - Все узлы
 *
 * @returns {JSX.Element} Компонент inline кнопки
 */
export function InlineButton({ button, allNodes }: InlineButtonProps) {
  const targetNode = button.action === 'goto' && button.target 
    ? allNodes?.find(n => n.id === button.target) 
    : null;
  const targetNodeDisplay = targetNode?.data?.messageText?.slice(0, 30) || 
                           targetNode?.data?.command || 
                           (button.action === 'goto' ? button.target?.slice(0, 8) : '');

  return (
    <div className="group relative">
      <div className="p-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors duration-200 shadow-sm">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-center space-x-1">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-300 truncate">
              {button.text}
            </span>
            {button.action === 'command' && (
              <i className="fas fa-terminal text-emerald-600 dark:text-emerald-400 text-xs opacity-70" title="Команда"></i>
            )}
            {button.action === 'url' && (
              <i className="fas fa-external-link-alt text-purple-600 dark:text-purple-400 text-xs opacity-70" title={`Ссылка: ${button.url}`}></i>
            )}
            {button.action === 'goto' && (
              <i className="fas fa-arrow-right text-blue-600 dark:text-blue-400 text-xs opacity-70" title={`К узлу: ${targetNodeDisplay}`}></i>
            )}
            {button.action === 'selection' && (
              <i className="fas fa-mouse-pointer text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Выбор"></i>
            )}
          </div>
          {button.action === 'goto' && (
            <div className="text-[10px] text-blue-600 dark:text-blue-300 truncate">
              К узлу: {targetNodeDisplay}{targetNodeDisplay?.length === 30 ? '...' : ''}
            </div>
          )}
          {button.action === 'url' && (
            <div className="text-[10px] text-purple-600 dark:text-purple-300 truncate">
              🔗 {button.url}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
