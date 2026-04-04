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

  /** Классы фона и текста в зависимости от style (Bot API 9.4) */
  const styleClass = (button as any).style === 'primary'
    ? 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white'
    : (button as any).style === 'success'
    ? 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-500 text-white'
    : (button as any).style === 'danger'
    ? 'bg-red-500 dark:bg-red-600 border-red-600 dark:border-red-500 text-white'
    : 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';

  return (
    <div className={`rounded-lg border shadow-sm transition-colors p-3 ${styleClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
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
          {button.action === 'copy_text' && (
            <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
              📋 {(button as any).copyText}
            </div>
          )}
          {button.action === 'web_app' && (
            <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 truncate">
              🌐 {(button as any).webAppUrl}
            </div>
          )}
          {button.hideAfterClick && (
            <div className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <i className="fas fa-eye-slash text-[10px]"></i>
              <span>скрыть</span>
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
          {button.action === 'copy_text' && (
            <i className="fas fa-clipboard text-yellow-600 dark:text-yellow-400 text-xs opacity-70" title="Копировать текст"></i>
          )}
          {button.action === 'web_app' && (
            <i className="fas fa-globe text-cyan-600 dark:text-cyan-400 text-xs opacity-70" title={`Web App: ${(button as any).webAppUrl}`}></i>
          )}
        </div>
      </div>
    </div>
  );
}
