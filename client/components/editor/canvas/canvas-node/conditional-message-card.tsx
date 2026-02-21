/**
 * @fileoverview Компонент карточки условного сообщения
 * 
 * Отображает отдельное условие с иконкой, названием
 * и превью сообщения.
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Типы условий
 */
type ConditionType = 'user_data_equals' | 'user_data_contains' | 'user_data_exists' | 'user_data_not_exists';

/**
 * Интерфейс свойств компонента ConditionalMessageCard
 *
 * @interface ConditionalMessageCardProps
 * @property {any} condition - Объект условия
 * @property {React.ReactNode} [children] - Дочерние элементы (кнопки)
 */
interface ConditionalMessageCardProps {
  condition: any;
  children?: React.ReactNode;
}

/**
 * Конфигурация иконок для типов условий
 */
const CONDITION_ICONS: Record<ConditionType, string> = {
  user_data_equals: 'fas fa-equals',
  user_data_contains: 'fas fa-search',
  user_data_exists: 'fas fa-check-circle',
  user_data_not_exists: 'fas fa-times-circle'
};

/**
 * Конфигурация цветов для типов условий
 */
const CONDITION_COLORS: Record<ConditionType, string> = {
  user_data_equals: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  user_data_contains: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  user_data_exists: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
  user_data_not_exists: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30'
};

/**
 * Получение названия условия
 */
function getConditionName(condition: any): string {
  const varName = condition.variableName || 'переменная';
  const conditionType = condition.condition as ConditionType;
  const baseNames: Record<ConditionType, string> = {
    user_data_equals: `{${varName}} был введен ранее`,
    user_data_contains: `{${varName}} содержит текст`,
    user_data_exists: `{${varName}} был введен ранее`,
    user_data_not_exists: `{${varName}} не введен`
  };
  return baseNames[conditionType] || 'Условие';
}

/**
 * Компонент карточки условного сообщения
 *
 * @component
 * @description Отображает карточку одного условия
 *
 * @param {ConditionalMessageCardProps} props - Свойства компонента
 * @param {any} props.condition - Объект условия
 * @param {React.ReactNode} [props.children] - Дочерние элементы
 *
 * @returns {JSX.Element} Компонент карточки условия
 */
export function ConditionalMessageCard({ condition, children }: ConditionalMessageCardProps) {
  const isValidConditionType = (type: string): type is ConditionType => {
    return type in CONDITION_ICONS;
  };
  
  const conditionType: ConditionType = isValidConditionType(condition.condition)
    ? condition.condition
    : 'user_data_exists';
  const conditionName = getConditionName(condition);

  return (
    <div className="bg-white/60 dark:bg-slate-900/40 rounded-lg border border-purple-100 dark:border-purple-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-1">
          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-xs", CONDITION_COLORS[conditionType])}>
            <i className={CONDITION_ICONS[conditionType]}></i>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
              {conditionName}
            </div>
          </div>
        </div>
      </div>

      {condition.messageText?.trim() && (
        <div className="bg-slate-50/70 dark:bg-slate-800/50 rounded p-2 border border-slate-200/50 dark:border-slate-700/50">
          <div className="text-xs text-slate-600 dark:text-slate-400 mb-1 flex items-center space-x-1">
            <i className="fas fa-comment text-xs"></i>
            <span className="font-medium">Сообщение:</span>
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed line-clamp-2">
            {condition.messageText}
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
