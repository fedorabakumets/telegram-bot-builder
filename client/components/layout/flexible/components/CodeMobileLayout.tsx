/**
 * @fileoverview Мобильный layout для панели кода с переключением вкладок
 * @description По образцу BotLayout — вкладки "Панель" / "Код".
 * На мобильных показывает табы, на десктопе рендерит оба компонента рядом через ResizablePanelGroup.
 * Оба компонента остаются в DOM (через hidden) чтобы не терять состояние Monaco Editor.
 */

import React, { useState } from 'react';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import { CodeResizeHandle } from '../../code-resize-handle';

/** Тип активной вкладки на мобильных */
type CodeMobileTab = 'panel' | 'editor';

/**
 * Пропсы компонента CodeMobileLayout
 */
interface CodeMobileLayoutProps {
  /** Содержимое панели кода (CodePanel) */
  panelContent: React.ReactNode;
  /** Содержимое редактора кода (CodeEditorArea) */
  editorContent: React.ReactNode;
}

/**
 * Мобильный layout для панели кода
 * На мобильных (< 768px) показывает переключаемые вкладки "Панель" / "Код".
 * На десктопе рендерит оба компонента рядом с resizable-разделителем.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function CodeMobileLayout({ panelContent, editorContent }: CodeMobileLayoutProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CodeMobileTab>('panel');
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel id="code-panel-left" order={1} defaultSize={30} minSize={15} maxSize={50} className="overflow-hidden">
          <div className="h-full w-full bg-background overflow-hidden flex flex-col">
            {panelContent}
          </div>
        </ResizablePanel>
        <CodeResizeHandle direction="vertical" />
        <ResizablePanel id="code-editor-center" order={2} defaultSize={70} minSize={50} maxSize={85} className="overflow-hidden">
          <div className="h-full w-full bg-background overflow-hidden flex flex-col">
            {editorContent}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Панель вкладок */}
      <div className="flex border-b border-border bg-background flex-shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('panel')}
          className={[
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'panel'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
          aria-label="Панель кода"
        >
          <i className="fas fa-list w-4 h-4" />
          Панель
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={[
            'flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'editor'
              ? 'text-foreground border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground',
          ].join(' ')}
          aria-label="Редактор кода"
        >
          <i className="fas fa-code w-4 h-4" />
          Код
        </button>
      </div>

      {/* Контент вкладок — оба в DOM, один скрыт */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className={activeTab === 'panel' ? 'h-full' : 'hidden'}>
          {panelContent}
        </div>
        <div className={activeTab === 'editor' ? 'h-full' : 'hidden'}>
          {editorContent}
        </div>
      </div>
    </div>
  );
}
