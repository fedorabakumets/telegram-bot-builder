/**
 * @fileoverview Главный компонент InlineRichEditor
 * @description Визуальный редактор текста с форматированием и переменными
 */

import { useInlineRichEditor } from './hooks/useInlineRichEditor';
import type { InlineRichEditorProps } from './types';
import { formatOptions } from './format-options';
import { EditorToolbar } from './components/EditorToolbar';
import { VariablesMenu } from './components/VariablesMenu';
import { EditorContent } from './components/EditorContent';
import { StatsBar } from './components/StatsBar';

/** Компонент встроенного редактора с поддержкой форматирования */
export function InlineRichEditor(props: InlineRichEditorProps) {
  const { editorRef, wordCount, charCount, undo, redo, applyFormatting, handleKeyDown, copyFormatted, insertVariable, handleInput } = useInlineRichEditor(props);

  const variablesMenu = <VariablesMenu availableVariables={props.availableVariables || []} insertVariable={insertVariable} />;

  return (
    <div className="space-y-2 sm:space-y-3">
      <EditorToolbar formatOptions={formatOptions} applyFormatting={applyFormatting} undo={undo} redo={redo} canUndo={true} canRedo={true} copyFormatted={copyFormatted} variablesMenu={variablesMenu} />
      <EditorContent value={props.value} onInput={handleInput} onKeyDown={handleKeyDown} placeholder={props.placeholder || "Введите текст сообщения..."} innerRef={editorRef}>
        <StatsBar wordCount={wordCount} charCount={charCount} />
      </EditorContent>
    </div>
  );
}
