/**
 * @fileoverview Компонент ответа кнопками
 * 
 * Отображает информацию о сборе ответов через кнопки
 * с указанием переменной для сохранения.
 */

/**
 * Интерфейс свойств компонента ButtonResponses
 *
 * @interface ButtonResponsesProps
 * @property {string} [inputVariable] - Имя переменной для сохранения ответа
 */
interface ButtonResponsesProps {
  inputVariable?: string;
}

/**
 * Компонент ответа кнопками
 *
 * @component
 * @description Отображает информацию об ответах через кнопки
 *
 * @param {ButtonResponsesProps} props - Свойства компонента
 * @param {string} [props.inputVariable] - Имя переменной
 *
 * @returns {JSX.Element} Компонент ответа кнопками
 */
export function ButtonResponses({ inputVariable }: ButtonResponsesProps) {
  return (
    <div className="flex items-center space-x-3 bg-white/60 dark:bg-slate-900/40 rounded-lg border border-orange-100 dark:border-orange-800/30 p-3 hover:bg-white/80 dark:hover:bg-slate-900/60 transition-colors">
      <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xs">
        <i className="fas fa-mouse text-amber-600 dark:text-amber-400 text-xs"></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
          Кнопки как варианты ответа
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center space-x-1 mt-1">
          {inputVariable ? (
            <>
              <i className="fas fa-database text-xs"></i>
              <code className="bg-amber-100 dark:bg-amber-900/30 px-1.5 py-0.5 rounded text-xs font-mono text-amber-700 dark:text-amber-300">
                {inputVariable}
              </code>
            </>
          ) : (
            <span className="text-amber-600 dark:text-amber-400 italic">Переменная не задана</span>
          )}
        </div>
      </div>
    </div>
  );
}
