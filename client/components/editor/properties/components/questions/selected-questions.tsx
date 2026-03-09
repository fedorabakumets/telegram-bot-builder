/**
 * @fileoverview Компонент отображения выбранных вопросов
 * @description Показывает список выбранных вопросов в виде бейджей.
 */

interface SelectedQuestionsProps {
  selectedNames: string[];
}

/**
 * Компонент отображения выбранных вопросов
 */
export function SelectedQuestions({ selectedNames }: SelectedQuestionsProps) {
  if (selectedNames.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-green-50/70 to-emerald-50/50 dark:from-green-950/30 dark:to-emerald-950/20 border border-green-200/60 dark:border-green-800/50 rounded-xl p-3 sm:p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2.5">
        <i className="fas fa-check-circle text-green-600 dark:text-green-400"></i>
        <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-300">
          Выбрано: {selectedNames.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {selectedNames.map((name, idx) => (
          <span key={idx} className="inline-flex items-center text-xs sm:text-xs bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/40 text-green-700 dark:text-green-300 px-3 py-1.5 rounded-full font-medium shadow-sm">
            <i className="fas fa-tag mr-1.5 text-xs opacity-70"></i>
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}
