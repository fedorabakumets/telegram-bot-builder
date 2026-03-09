/**
 * @fileoverview Компонент информации о нажатой кнопке
 * Отображает текст нажатой кнопки пользователя
 */

/**
 * Свойства информации о кнопке
 */
interface ButtonClickedInfoProps {
  /** Текст нажатой кнопки */
  buttonText?: string | null;
}

/**
 * Компонент отображения информации о нажатой кнопке
 */
export function ButtonClickedInfo({ buttonText }: ButtonClickedInfoProps) {
  if (!buttonText) return null;

  return (
    <div className="mt-1">
      <div className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-md bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200">
        <span>{buttonText}</span>
      </div>
    </div>
  );
}
