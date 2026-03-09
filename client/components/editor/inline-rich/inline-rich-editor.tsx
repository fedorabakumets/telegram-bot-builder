/**
 * @fileoverview Главный компонент InlineRichEditor
 * @description Визуальный редактор текста с форматированием и переменными
 */

import { useState, useEffect } from 'react';
import { useInlineRichEditor } from './hooks/useInlineRichEditor';
import type { InlineRichEditorProps } from './types';
import type { Node } from '@shared/schema';
import { formatOptions } from './format-options';
import { EditorToolbar } from './components/EditorToolbar';
import { EditorContent } from './components/EditorContent';
import { StatsBar } from './components/StatsBar';
import { UsedVariablesList, extractVariables } from './components/UsedVariablesList';

/** Пропсы компонента InlineRichEditor */
interface InlineRichEditorWithFiltersProps extends InlineRichEditorProps {
  /** Текущие фильтры переменных */
  variableFilters?: Record<string, string>;
  /** Функция обновления фильтров */
  onFiltersChange?: (filters: Record<string, string>) => void;
  /** Все узлы проекта */
  allNodes?: Node[];
}

/** Компонент встроенного редактора с поддержкой форматирования */
export function InlineRichEditor(props: InlineRichEditorWithFiltersProps) {
  const { editorRef, wordCount, charCount, undo, redo, applyFormatting, handleKeyDown, copyFormatted, insertVariable, applyFilterToVariable, handleInput } = useInlineRichEditor(props);
  
  // Храним фильтры переменных отдельно от текста
  const [variableFilters, setVariableFilters] = useState<Record<string, string>>(props.variableFilters || {});
  
  // Синхронизируем с внешним состоянием
  useEffect(() => {
    if (props.variableFilters) {
      setVariableFilters(props.variableFilters);
    }
  }, [props.variableFilters]);
  
  // Уведомляем об изменении фильтров
  useEffect(() => {
    if (props.onFiltersChange) {
      props.onFiltersChange(variableFilters);
    }
  }, [variableFilters, props.onFiltersChange]);
  
  const variables = extractVariables(props.value || '', props.allNodes || []);
  
  // Обёртка для применения фильтра с обновлением состояния
  const handleApplyFilter = (variableName: string, filter: string) => {
    setVariableFilters(prev => {
      const updated = { ...prev };
      if (filter === '') {
        delete updated[variableName];
      } else {
        updated[variableName] = filter;
      }
      return updated;
    });
    applyFilterToVariable(variableName, filter);
  };

  return (
    <div className="space-y-2 sm:space-y-3">
      <EditorToolbar
        formatOptions={formatOptions}
        applyFormatting={applyFormatting}
        undo={undo}
        redo={redo}
        canUndo={true}
        canRedo={true}
        copyFormatted={copyFormatted}
        availableVariables={props.availableVariables || []}
        insertVariable={insertVariable}
      />
      <EditorContent value={props.value} onInput={handleInput} onKeyDown={handleKeyDown} placeholder={props.placeholder || "Введите текст сообщения..."} innerRef={editorRef}>
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
