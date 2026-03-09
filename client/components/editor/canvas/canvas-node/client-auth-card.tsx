/**
 * @fileoverview Компонент отображения узла авторизации Client API на холсте
 * 
 * Визуальное представление узла авторизации с иконкой и названием.
 * Используется в CanvasNode для рендеринга на холсте.
 * 
 * @module editor/canvas/canvas-node/client-auth-card
 */

import { Node } from '@/types/bot';

/**
 * Пропсы компонента ClientAuthCard
 */
interface ClientAuthCardProps {
  /** Данные узла для отображения */
  node: Node;
}

/**
 * Компонент карточки авторизации Client API
 * 
 * @param {ClientAuthCardProps} props - Пропсы компонента
 * @returns {JSX.Element} Карточка узла авторизации
 */
export function ClientAuthCard({ node }: ClientAuthCardProps) {
  const hasSession = node.data?.sessionCreated === true;
  
  return (
    <div className="rounded-xl p-4 mb-4 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
          <i className="fas fa-key text-emerald-600 dark:text-emerald-400 text-sm"></i>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">
              {hasSession ? '✅ Сессия активна' : '⏳ Требуется авторизация'}
            </h4>
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            {node.data?.sessionName || 'user_session'}
          </p>
        </div>
      </div>
    </div>
  );
}
