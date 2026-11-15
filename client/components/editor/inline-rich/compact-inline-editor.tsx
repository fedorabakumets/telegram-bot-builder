/**
 * @fileoverview Компактный InlineRichEditor для диалоговых панелей
 * @description Уменьшенная версия редактора с адаптированным UI
 */

import { useInlineRichEditor } from './hooks/useInlineRichEditor';
import type { InlineRichEditorProps } from './types';
import { formatOptions } from './format-options';
import { Toolbar } from './components/Toolbar';
import { EditorContent } from './components/EditorContent';
import { LinkInputRow } from './components/LinkInputRow';

/**
 * Свойства компактного редактора
 */
export interface CompactInlineEditorProps extends Omit<InlineRichEditorProps, 'enableMarkdown' | 'availableVariables'> {
  /** Показывать ли статистику */
  showStats?: boolean;
  /** Размещать панель форматирования на всю ширину сетки ввода сообщения. */
  composerLayout?: boolean;
}

/**
 * Компактный редактор текста для диалоговых панелей.
 * Поддерживает все форматы включая вставку ссылок через LinkInputRow.
 * @param props - Свойства компонента
 * @returns JSX элемент компактного редактора
 */
export function CompactInlineEditor({ showStats = false, composerLayout = false, ...props }: CompactInlineEditorProps) {
  const {
    editorRef, wordCount, charCount,
    undo, redo, canUndo, canRedo,
    applyFormatting, handleKeyDown,
    copyFormatted, handleInput,
    linkPopover, saveSelectionOnBlur, handlePaste,
    activeFormats,
  } = useInlineRichEditor({ ...props, enableMarkdown: false });

  return (
    <div className={composerLayout ? "contents" : "space-y-1.5"}>
      <div className={composerLayout ? "col-span-3 row-start-1 min-w-0" : "contents"}>
      <Toolbar
        compact
        formatOptions={formatOptions}
        applyFormatting={applyFormatting}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        copyFormatted={copyFormatted}
        activeFormats={activeFormats}
      />
      </div>

      {/* Строка ввода URL — появляется между тулбаром и редактором */}
      {linkPopover.isOpen && <div className={composerLayout ? "col-span-3 row-start-2 min-w-0" : "contents"}>
      <LinkInputRow
        isOpen={linkPopover.isOpen}
        currentUrl={linkPopover.currentUrl}
        onApply={linkPopover.applyLink}
        onRemove={linkPopover.removeLink}
        onClose={linkPopover.closeLinkPopover}
      />
      </div>}

      <div className={composerLayout ? "col-start-2 row-start-3 min-w-0" : "contents"}>
      <EditorContent
        value={props.value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder || 'Введите сообщение...'}
        innerRef={editorRef}
        onLinkClick={linkPopover.openLinkPopover}
        onBlur={saveSelectionOnBlur}
        onPaste={handlePaste}
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
    </div>
  );
}
