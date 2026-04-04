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
                           (button.action === 'goto' ? (button.target?.slice(0, 8) ?? '') : '');

  return (
    <div className="bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:border-gray-300 dark:hover:border-gray-600 transition-colors p-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
            {button.text}
          </div>
          {button.action === 'goto' && (
            <div className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 truncate">
              К узлу: {targetNodeDisplay}{targetNodeDisplay.length > 30 ? '...' : ''}
            </div>
          )}
          {(button.action === 'goto' || button.action === 'command' || button.customCallbackData) && (
            <div className="mt-1 text-xs text-gray-400 dark:text-gray-500 truncate font-mono">
              {button.customCallbackData || button.target || button.id || 'no_action'}
            </div>
          )}
          {button.action === 'url' && (
            <div className="mt-1.5 text-xs text-purple-600 dark:text-purple-300 truncate">
              🔗 {button.url}
            </div>
          )}
          {button.action === 'selection' && (
            <div className="mt-1.5 text-xs text-purple-600 dark:text-purple-400">
              Выбор
            </div>
          )}
          {button.action === 'complete' && (
            <div className="mt-1.5 text-xs text-purple-600 dark:text-purple-400">
              Завершение
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
          {button.action === 'url' && (
            <i className="fas fa-external-link-alt text-purple-600 dark:text-purple-400 text-xs opacity-70" title={`Ссылка: ${button.url}`}></i>
          )}
          {button.action === 'goto' && (
            <i className="fas fa-arrow-right text-blue-600 dark:text-blue-400 text-xs opacity-70" title={`К узлу: ${targetNodeDisplay}`}></i>
          )}
          {button.action === 'selection' && (
            <i className="fas fa-mouse-pointer text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Выбор"></i>
          )}
          {button.action === 'complete' && (
            <i className="fas fa-flag-checkered text-purple-600 dark:text-purple-400 text-xs opacity-70" title="Завершение"></i>
          )}
        </div>
      </div>
    </div>
  );
}
