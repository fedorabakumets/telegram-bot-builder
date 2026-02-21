/**
 * @fileoverview Компонент кнопки сохранения проекта
 * 
 * Содержит кнопку для сохранения проекта с индикатором процесса
 * в компоненте Canvas.
 */

/**
 * Свойства компонента кнопки сохранения
 */
interface SaveButtonProps {
  /** Колбэк для сохранения */
  onSave?: () => void;
  /** Флаг процесса сохранения */
  isSaving?: boolean;
}

/**
 * Компонент кнопки сохранения проекта
 * 
 * @param props - Свойства компонента
 * @returns JSX элемент кнопки сохранения
 */
export function SaveButton({ onSave, isSaving }: SaveButtonProps) {
  if (!onSave) return null;

  return (
    <button
      onClick={onSave}
      disabled={isSaving}
      className="flex-shrink-0 p-0 h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 dark:from-blue-700 dark:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 border border-blue-500/60 hover:border-blue-400/70 dark:border-blue-600/60 dark:hover:border-blue-500/70 transition-all duration-200 group disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center shadow-md shadow-blue-600/30 hover:shadow-lg hover:shadow-blue-600/40 dark:shadow-blue-700/30 dark:hover:shadow-lg dark:hover:shadow-blue-700/40"
      title="Сохранить проект (Ctrl + S)"
    >
      {isSaving ? (
        <i className="fas fa-spinner fa-spin text-white text-sm" />
      ) : (
        <i className="fas fa-save text-white text-sm transition-colors" />
      )}
    </button>
  );
}
