/**
 * @fileoverview Компонент списка вопросов с чекбоксами
 * @description Отображает доступные вопросы для выбора в условиях.
 */

interface Question {
  name: string;
  nodeId: string;
  nodeType?: string;
  mediaType?: string;
}

interface QuestionCheckboxListProps {
  availableQuestions: Question[];
  selectedNames: string[];
  onSelectionChange: (names: string[]) => void;
}

const getMediaIcon = (mediaType?: string) => {
  if (!mediaType) return null;
  const icons: Record<string, string> = {
    photo: '📷',
    video: '🎥',
    audio: '🎵',
    document: '📄'
  };
  return icons[mediaType] || null;
};

const getMediaBadgeClass = (mediaType?: string) => {
  if (!mediaType) return 'from-blue-100 to-blue-100 dark:from-blue-900/50 dark:to-blue-900/40 text-blue-700 dark:text-blue-300';
  return 'from-purple-100 to-purple-100 dark:from-purple-900/50 dark:to-purple-900/40 text-purple-700 dark:text-purple-300';
};

/**
 * Компонент списка вопросов с чекбоксами
 */
export function QuestionCheckboxList({ availableQuestions, selectedNames, onSelectionChange }: QuestionCheckboxListProps) {
  const handleToggle = (name: string, checked: boolean) => {
    const updated = checked
      ? [...selectedNames, name]
      : selectedNames.filter(n => n !== name);
    onSelectionChange(updated);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/60 to-purple-50/30 dark:from-blue-950/30 dark:to-purple-950/15 rounded-xl p-3 sm:p-4 border border-blue-200/50 dark:border-blue-800/40 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-2 mb-3">
        <i className="fas fa-checklist text-blue-600 dark:text-blue-400 text-sm"></i>
        <span className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">Доступные вопросы:</span>
        <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-semibold">
          {availableQuestions.length}
        </span>
      </div>
      <div className="space-y-2 sm:space-y-2.5 max-h-40 sm:max-h-48 overflow-y-auto pr-2">
        {availableQuestions.map((question) => {
          const isSelected = selectedNames.includes(question.name);
          return (
            <label key={`${question.nodeId}-${question.name}`} className="flex items-center space-x-3 p-2 sm:p-2.5 rounded-lg hover:bg-white/40 dark:hover:bg-slate-800/40 cursor-pointer transition-all group">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={(e) => handleToggle(question.name, e.target.checked)}
                className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 rounded-md border border-purple-300 dark:border-purple-700 cursor-pointer accent-purple-600 dark:accent-purple-400"
              />
              <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                {question.mediaType || question.nodeType ? (
                  <span className={`inline-flex items-center gap-1 text-xs sm:text-xs bg-gradient-to-r ${getMediaBadgeClass(question.mediaType)} px-2 py-1 rounded-md whitespace-nowrap font-medium shadow-sm`}>
                    {getMediaIcon(question.mediaType) && <span>{getMediaIcon(question.mediaType)}</span>}
                    <span className="hidden sm:inline">{question.mediaType || question.nodeType}</span>
                  </span>
                ) : null}
                <span className="text-xs sm:text-sm text-foreground truncate font-medium group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">{question.name}</span>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
}
