/**
 * @fileoverview Компонент reply кнопки
 *
 * Отображает отдельную reply кнопку с информацией о действии,
 * превью перехода к узлу, ссылки, запроса контакта или геолокации.
 */

import { Node } from '@/types/bot';
import type { Button } from '@shared/schema';

/**
 * Пропсы компонента ReplyButton
 */
interface ReplyButtonProps {
  /** Объект кнопки */
  button: Button;
  /** Все узлы для поиска целевых */
  allNodes?: Node[];
}

/**
 * Компонент reply кнопки на канвасе.
 * Отображает текст кнопки и индикатор действия (переход, ссылка, контакт, геолокация).
 *
 * @param props - Свойства компонента
 * @returns JSX элемент reply кнопки
 */
export function ReplyButton({ button, allNodes }: ReplyButtonProps) {
  const targetNode = button.action === 'goto' && button.target 
    ? allNodes?.find(n => n.id === button.target) 
    : null;
  const targetNodeDisplay = targetNode?.data?.messageText?.slice(0, 30) || 
                           targetNode?.data?.command || 
                           (button.action === 'goto' ? (button.target?.slice(0, 8) ?? '') : '');

  /** Классы фона и текста в зависимости от style (Bot API 9.4) */
  const styleClass = (button as any).style === 'primary'
    ? 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white'
    : (button as any).style === 'secondary'
    ? 'bg-gray-400 dark:bg-gray-600 border-gray-500 dark:border-gray-500 text-white'
    : (button as any).style === 'destructive'
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
          {button.requestContact && (
            <div className="mt-1.5 text-xs text-green-600 dark:text-green-400">📞 Контакт</div>
          )}
          {button.requestLocation && (
            <div className="mt-1.5 text-xs text-blue-600 dark:text-blue-400">📍 Геолокация</div>
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
          {button.requestContact && (
            <span className="text-xs opacity-70" title="Запрос контакта">📞</span>
          )}
          {button.requestLocation && (
            <span className="text-xs opacity-70" title="Запрос геолокации">📍</span>
          )}
        </div>
      </div>
    </div>
  );
}
