/**
 * @fileoverview Список конфликтов правил условного сообщения
 * 
 * Отображает список ошибок и предупреждений для условия.
 */

import type { RuleConflict } from '../../utils/conditional-utils';

/** Пропсы списка конфликтов */
interface ConditionalMessageConflictsListProps {
  /** Список конфликтов */
  ruleConflicts: RuleConflict[];
}

/**
 * Компонент списка конфликтов правил условного сообщения
 * 
 * @param {ConditionalMessageConflictsListProps} props - Пропсы компонента
 * @returns {JSX.Element} Список конфликтов
 */
export function ConditionalMessageConflictsList({ ruleConflicts }: ConditionalMessageConflictsListProps) {
  return (
    <div className="bg-gradient-to-br from-red-50/70 to-rose-50/40 dark:from-red-950/40 dark:to-rose-950/20 border-b border-red-200/50 dark:border-red-800/50 px-3 sm:px-4 py-3 sm:py-4">
      <div className="space-y-2 sm:space-y-2.5">
        <div className="flex items-center gap-2 mb-2.5">
          <i className="fas fa-shield-exclamation text-red-600 dark:text-red-400 text-sm"></i>
          <span className="text-xs sm:text-sm font-semibold text-red-700 dark:text-red-300">
            {ruleConflicts.length} {ruleConflicts.length === 1 ? 'ошибка' : ruleConflicts.length < 5 ? 'ошибки' : 'ошибок'} в условиях
          </span>
        </div>

        {ruleConflicts.map((conflict, idx) => (
          <div key={idx} className="bg-white/40 dark:bg-slate-900/40 border border-red-200/50 dark:border-red-800/40 rounded-lg p-2.5 sm:p-3 flex items-start gap-2 sm:gap-3 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all">
            <div className="flex-shrink-0 mt-0.5">
              {conflict.severity === 'error' ? (
                <i className="fas fa-circle-xmark text-red-600 dark:text-red-400 text-sm"></i>
              ) : (
                <i className="fas fa-triangle-exclamation text-amber-500 dark:text-amber-400 text-sm"></i>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className={`text-xs sm:text-sm leading-relaxed block ${conflict.severity === 'error'
                ? 'text-red-700 dark:text-red-300'
                : 'text-amber-700 dark:text-amber-300'
                }`}>
                {conflict.description}
              </span>
              {conflict.severity === 'error' && (
                <span className="text-xs text-red-600 dark:text-red-400 mt-1 block">Требует исправления</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
