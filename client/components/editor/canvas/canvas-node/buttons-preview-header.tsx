interface ButtonsPreviewHeaderProps {
  isMultiSelect?: boolean;
  keyboardType?: 'inline' | 'reply';
  isDynamicMode?: boolean;
  dynamicSummary?: string;
}

export function ButtonsPreviewHeader({
  isMultiSelect,
  keyboardType,
  isDynamicMode,
  dynamicSummary,
}: ButtonsPreviewHeaderProps) {
  const getKeyboardLabel = () => {
    if (isDynamicMode) return 'Dynamic inline';
    if (isMultiSelect) return 'Множественный выбор';
    if (keyboardType === 'inline') return 'Inline кнопки';
    if (keyboardType === 'reply') return 'Reply кнопки';
    return 'Кнопки';
  };

  return (
    <div className="mb-3 space-y-1.5">
      <div className="flex items-center space-x-2">
        <div className="w-1 h-4 bg-amber-500 dark:bg-amber-400 rounded-full" />
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {getKeyboardLabel()}
        </span>
        {isDynamicMode && (
          <div className="text-xs text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
            HTTP response
          </div>
        )}
        {isMultiSelect && (
          <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/50 px-2 py-1 rounded-full">
            <i className="fas fa-check-double text-xs mr-1"></i>
            Мульти-выбор
          </div>
        )}
      </div>
      {isDynamicMode && dynamicSummary && (
        <div className="text-[11px] leading-4 text-slate-500 dark:text-slate-400 pl-3">
          {dynamicSummary}
        </div>
      )}
    </div>
  );
}
