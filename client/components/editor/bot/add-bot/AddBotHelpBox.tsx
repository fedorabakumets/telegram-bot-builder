/**
 * @fileoverview Инструкция по получению токена
 *
 * Компонент отображает подсказку с инструкцией.
 *
 * @module AddBotHelpBox
 */

/**
 * Инструкция по получению токена
 */
export function AddBotHelpBox() {
  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 space-y-2">
      <p className="text-xs sm:text-sm text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-2">
        <span className="w-1 h-1 bg-blue-600 rounded-full flex-shrink-0" />
        Как получить токен?
      </p>
      <ol className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 space-y-1 ml-3">
        <li>1. Откройте Telegram и найдите <span className="font-semibold">@BotFather</span></li>
        <li>2. Отправьте команду <span className="font-mono bg-blue-900/20 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">/newbot</span></li>
        <li>3. Следуйте инструкциям и скопируйте токен</li>
      </ol>
    </div>
  );
}
