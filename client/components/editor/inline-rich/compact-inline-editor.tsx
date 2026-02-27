/**
 * @fileoverview Компактный InlineRichEditor для диалоговых панелей
 * @description Уменьшенная версия редактора с адаптированным UI
 */

import { useInlineRichEditor } from './hooks/useInlineRichEditor';
import type { InlineRichEditorProps } from './types';
import { formatOptions } from './format-options';
import { CompactToolbar } from './components/CompactToolbar';
import { EditorContent } from './components/EditorContent';

/**
 * Свойства компактного редактора
 */
export interface CompactInlineEditorProps extends Omit<InlineRichEditorProps, 'enableMarkdown' | 'availableVariables'> {
  /** Показывать ли статистику */
  showStats?: boolean;
}

/**
 * Компактный редактор текста для диалоговых панелей
 */
export function CompactInlineEditor({ showStats = false, ...props }: CompactInlineEditorProps) {
  const { editorRef, wordCount, charCount, undo, redo, applyFormatting, handleKeyDown, copyFormatted, handleInput } = useInlineRichEditor({ ...props, enableMarkdown: false });

  return (
    <div className="space-y-1.5">
      <CompactToolbar
        formatOptions={formatOptions}
        applyFormatting={applyFormatting}
        undo={undo}
        redo={redo}
        canUndo={true}
        canRedo={true}
        copyFormatted={copyFormatted}
      />
      <EditorContent
        value={props.value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder || "Введите сообщение..."}
        innerRef={editorRef}
      >
        {showStats && (
          <div className="flex items-center justify-end gap-2 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200/50 dark:border-slate-800/50">
            <span className="text-xs text-slate-600 dark:text-slate-400">
              {wordCount} слов, {charCount} симв.
            </span>
          </div>
        )}
      </EditorContent>
    </div>
  );
}
