/**
 * @fileoverview Компонент элемента ответа (сбор данных)
 * 
 * Отображает отдельный элемент сбора данных:
 * текст, фото, видео, аудио или документ.
 */

/**
 * Типы элементов сбора данных
 */
type ResponseItemType = 'text' | 'photo' | 'video' | 'audio' | 'document' | 'multi-select';

/**
 * Интерфейс свойств компонента ResponseItem
 *
 * @interface ResponseItemProps
 * @property {string} type - Тип элемента
 * @property {string} variableName - Имя переменной для сохранения
 * @property {string} [label] - Отображаемое название
 */
interface ResponseItemProps {
  type: ResponseItemType;
  variableName: string;
  label?: string;
}

/**
 * Конфигурация иконок и цветов для типов ответов
 */
const RESPONSE_CONFIG: Record<ResponseItemType, { icon: string; color: string; label: string }> = {
  text: { icon: 'keyboard', color: 'blue', label: 'Текстовый ввод' },
  photo: { icon: 'image', color: 'purple', label: 'Фото' },
  video: { icon: 'video', color: 'red', label: 'Видео' },
  audio: { icon: 'microphone', color: 'green', label: 'Аудио' },
  document: { icon: 'file', color: 'amber', label: 'Документ' },
  'multi-select': { icon: 'check-double', color: 'indigo', label: 'Множественный выбор' }
};

/**
 * Компонент элемента ответа
 *
 * @component
 * @description Отображает элемент сбора данных с иконкой и переменной
 *
 * @param {ResponseItemProps} props - Свойства компонента
 * @param {ResponseItemType} props.type - Тип элемента
 * @param {string} props.variableName - Имя переменной
 * @param {string} [props.label] - Отображаемое название
 *
 * @returns {JSX.Element} Компонент элемента ответа
 */
export function ResponseItem({ type, variableName, label }: ResponseItemProps) {
  const config = RESPONSE_CONFIG[type];
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
  };

  const colorClass = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
      <div className={`w-5 h-5 rounded-full ${colorClass} flex items-center justify-center text-xs`}>
        <i className={`fas fa-${config.icon}`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {label || config.label}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
          <i className="fas fa-database text-xs"></i>
          <code className={`${colorClass} px-1.5 py-0.5 rounded text-xs font-mono`}>
            {variableName}
          </code>
        </div>
      </div>
    </div>
  );
}
