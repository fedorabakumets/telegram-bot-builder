/**
 * @fileoverview Главный компонент InlineRichEditor
 * @description Визуальный редактор текста с форматированием и переменными
 */

import { useInlineRichEditor } from './hooks/useInlineRichEditor';
import { useVariableFilters } from './hooks/useVariableFilters';
import type { InlineRichEditorWithFiltersProps } from './types';
import { formatOptions } from './format-options';
import { Toolbar } from './components/Toolbar';
import { EditorContent } from './components/EditorContent';
import { StatsBar } from './components/StatsBar';
import { UsedVariablesList } from './components/UsedVariablesList';
import { LinkInputRow } from './components/LinkInputRow';

/**
 * Компонент встроенного редактора с поддержкой форматирования и фильтров переменных
 * @param props - Свойства компонента
 * @returns JSX элемент редактора
 */
export function InlineRichEditor(props: InlineRichEditorWithFiltersProps) {
  const {
    editorRef, wordCount, charCount,
    undo, redo, canUndo, canRedo,
    applyFormatting, handleKeyDown,
    copyFormatted, insertVariable, handleInput,
    linkPopover
  } = useInlineRichEditor(props);

  const { variables, variableFilters, handleApplyFilter } = useVariableFilters({
    value: props.value,
    allNodes: props.allNodes,
    initialFilters: props.variableFilters,
    onFiltersChange: props.onFiltersChange
  });

  return (
    <div className="space-y-2 sm:space-y-3">
      <Toolbar
        formatOptions={formatOptions}
        applyFormatting={applyFormatting}
        undo={undo}
        redo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
        copyFormatted={copyFormatted}
        availableVariables={props.availableVariables || []}
        insertVariable={insertVariable}
      />
      <LinkInputRow
        isOpen={linkPopover.isOpen}
        currentUrl={linkPopover.currentUrl}
        onApply={linkPopover.applyLink}
        onRemove={linkPopover.removeLink}
        onClose={linkPopover.closeLinkPopover}
      />
      <EditorContent
        value={props.value}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={props.placeholder || 'Введите текст сообщения...'}
        innerRef={editorRef}
      >
        <StatsBar wordCount={wordCount} charCount={charCount} />
      </EditorContent>
      <UsedVariablesList
        variables={variables}
        variableFilters={variableFilters}
        onApplyFilter={handleApplyFilter}
      />
    </div>
  );
}
