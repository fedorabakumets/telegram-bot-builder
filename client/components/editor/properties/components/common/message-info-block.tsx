/**
 * @fileoverview Информационный блок о поддерживаемых функциях сообщения
 * 
 * Компонент отображает подсказку о возможностях текстового сообщения:
 * - Переменные вида {name}
 * - Markdown форматирование
 * - Медиафайлы
 * 
 * Используется в панели свойств узла для информирования пользователя
 * о доступных функциях при редактировании текста сообщения.
 * 
 * @module MessageInfoBlock
 */

/**
 * Пропсы компонента MessageInfoBlock
 */
interface MessageInfoBlockProps {
  /** Тип варианта отображения (blue - для текста, amber - для предупреждений) */
  variant?: 'blue' | 'amber';
}

/**
 * Компонент информационного блока о поддерживаемых функциях сообщения
 * 
 * Отображает иконку и текст с информацией о возможностях:
 * - Поддержка переменных вида {name}
 * - Markdown форматирование
 * - Работа с медиафайлами
 * 
 * @param {MessageInfoBlockProps} props - Пропсы компонента
 * @returns {JSX.Element} Информационный блок
 */
export function MessageInfoBlock({ variant = 'blue' }: MessageInfoBlockProps) {
  const styles = {
    blue: {
      container: 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-200/50 dark:border-blue-800/40',
      icon: 'fa-lightbulb text-blue-600 dark:text-blue-400',
      text: 'text-blue-700 dark:text-blue-300'
    },
    amber: {
      container: 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200/50 dark:border-amber-800/40',
      icon: 'fa-exclamation-triangle text-amber-600 dark:text-amber-400',
      text: 'text-amber-700 dark:text-amber-300'
    }
  };

  const currentStyle = styles[variant];

  return (
    <div className={`flex items-start gap-2 sm:gap-2.5 p-2.5 sm:p-3 rounded-lg border ${currentStyle.container}`}>
      <i className={`fas ${currentStyle.icon} text-xs sm:text-sm mt-0.5 flex-shrink-0`}></i>
      <p className={`text-xs sm:text-sm ${currentStyle.text} leading-relaxed`}>
        Поддерживает переменные вида {'{name}'}, Markdown форматирование и медиафайлы
      </p>
    </div>
  );
}
