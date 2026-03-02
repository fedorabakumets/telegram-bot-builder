/**
 * @fileoverview Конфигурация для типов кнопок.
 * 
 * Экспортирует объект с настройками отображения и поведения для каждого типа кнопки.
 */

/** 
 * @description Конфигурация для типа кнопки.
 * @property {string} label - Отображаемый текст.
 * @property {string} styles - CSS классы для стилизации.
 * @property {JSX.Element} icon - Иконка типа.
 */
export interface ButtonTypeConfig {
  label: string;
  styles: string;
  icon: JSX.Element;
}

/** 
 * @description Карта конфигураций для каждого типа кнопки.
 * @type {Record<'normal' | 'option' | 'complete', ButtonTypeConfig>}
 */
export const buttonTypeConfig: Record<'normal' | 'option' | 'complete', ButtonTypeConfig> = {
  normal: {
    label: 'Обычная',
    styles: 'bg-gradient-to-r from-blue-100/60 to-cyan-100/50 dark:from-blue-900/30 dark:to-cyan-900/20 text-blue-700 dark:text-blue-300 border border-blue-300/50 dark:border-blue-700/40',
    icon: <div className="w-1.5 h-1.5 bg-blue-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
  },
  option: {
    label: 'Опция',
    styles: 'bg-gradient-to-r from-green-100/60 to-emerald-100/50 dark:from-green-900/30 dark:to-emerald-900/20 text-green-700 dark:text-green-300 border border-green-300/50 dark:border-green-700/40',
    icon: <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
  },
  complete: {
    label: 'Завершение',
    styles: 'bg-gradient-to-r from-purple-100/60 to-pink-100/50 dark:from-purple-900/30 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 border border-purple-300/50 dark:border-purple-700/40',
    icon: <div className="w-1.5 h-1.5 bg-purple-500" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }}></div>
  }
};
