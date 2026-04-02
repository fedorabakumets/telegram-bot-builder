/**
 * @fileoverview Компонент карточки команд BotFather
 * Отображает команды для регистрации бота в @BotFather с возможностью копирования
 */

/**
 * Свойства компонента карточки BotFather
 */
interface BotFatherCardProps {
  /** Строка с командами для BotFather */
  commands: string;
}

/**
 * Компонент карточки команд для @BotFather
 * @param props - Свойства компонента
 * @returns JSX элемент карточки
 */
export function BotFatherCard({ commands }: BotFatherCardProps) {
  /**
   * Копирует команды в буфер обмена
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(commands);
      alert('Команды скопированы!');
    } catch {
      alert('Не удалось скопировать команды');
    }
  };

  return (
    <div className="bg-blue-50 dark:bg-blue-950/30 p-3 xs:p-4 rounded-lg border border-blue-200 dark:border-blue-800/40 space-y-2 my-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="font-medium text-blue-800 dark:text-blue-200 text-sm xs:text-base">
          <i className="fas fa-robot mr-2"></i>
          Команды для @BotFather
        </h4>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded border border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
          title="Скопировать команды"
        >
          <i className="fas fa-copy mr-1"></i>
          Копировать
        </button>
      </div>
      <pre
        className="bg-background p-2 xs:p-3 rounded text-xs overflow-auto max-h-32 border border-blue-200/50 dark:border-blue-800/30 whitespace-pre-wrap break-words cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        onClick={handleCopy}
      >
        {commands}
      </pre>
    </div>
  );
}
