/**
 * @fileoverview Информационный блок условных сообщений
 * 
 * Компонент отображает информацию о том, как работают условные сообщения.
 */

/**
 * Компонент информационного блока условных сообщений
 * 
 * @returns {JSX.Element} Информационный блок
 */
export function ConditionalMessagesInfoBlock() {
  return (
    <details className="group cursor-pointer">
      <summary className="flex items-center gap-2 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 select-none hover:text-blue-800 dark:hover:text-blue-200 transition-colors">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500/10 transition-transform duration-300" style={{ transform: 'rotate(-90deg)' }}>
          <i className="fas fa-chevron-down text-xs"></i>
        </span>
        <span>ℹ️ Как это работает?</span>
      </summary>
      <div className="mt-2 ml-6 space-y-1 text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
        <div className="flex gap-2"><span className="flex-shrink-0">📝</span> <span>Бот запомнит ответы пользователей</span></div>
        <div className="flex gap-2"><span className="flex-shrink-0">🎯</span> <span>Покажет разные сообщения</span></div>
        <div className="flex gap-2"><span className="flex-shrink-0">⚡</span> <span>Например: новым - "Добро пожаловать!", старым - "С возвращением!"</span></div>
      </div>
    </details>
  );
}
