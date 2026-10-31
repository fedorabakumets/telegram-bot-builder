/**
 * @fileoverview Мобильный layout для панели кода с переключением вкладок
 * @description На узком экране переключает список файлов и просмотр выбранного кода.
 * На мобильных показывает табы, на десктопе рендерит оба компонента рядом через ResizablePanelGroup.
 * Оба компонента остаются в DOM (через hidden) чтобы не терять состояние Monaco Editor.
 */

import React, { useRef, useState } from 'react';
import { useMediaQuery } from '@/components/editor/properties/hooks/use-media-query';
import { ResizablePanelGroup, ResizablePanel } from '@/components/ui/resizable';
import { CodeResizeHandle } from '../../code-resize-handle';
import { Code2, Files } from 'lucide-react';
import { CodeViewNavigationContext } from './code-view-navigation';

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
 * На мобильных (< 768px) показывает список файлов и переход к просмотру кода.
 * На десктопе рендерит оба компонента рядом с resizable-разделителем.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function CodeMobileLayout({ panelContent, editorContent }: CodeMobileLayoutProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<CodeMobileTab>('panel');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const [headerTarget, setHeaderTarget] = useState<HTMLDivElement | null>(null);

  /** Открывает редактор и сохраняет видимый фокус после выбора файла. */
  const openEditor = () => {
    setActiveTab('editor');
    previewButtonRef.current?.focus();
  };

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
    <CodeViewNavigationContext.Provider value={{ openCodeView: openEditor, headerTarget }}>
    <div className="flex flex-col h-full">
      <div ref={setHeaderTarget} className="code-panel shrink-0 px-4 pt-4" />
      {/* Панель вкладок */}
      <div role="group" aria-label="Просмотр файлов проекта" className="flex shrink-0 gap-2 border-b border-border bg-background p-3">
        <button
          type="button"
          onClick={() => setActiveTab('panel')}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
            activeTab === 'panel'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          ].join(' ')}
          aria-pressed={activeTab === 'panel'}
        >
          <Files className="h-4 w-4 shrink-0" aria-hidden="true" />
          {activeTab === 'editor' ? 'К файлам' : 'Файлы проекта'}
        </button>
        <button
          type="button"
          ref={previewButtonRef}
          onClick={openEditor}
          className={[
            'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
            activeTab === 'editor'
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          ].join(' ')}
          aria-pressed={activeTab === 'editor'}
        >
          <Code2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          Просмотр кода
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
    </CodeViewNavigationContext.Provider>
  );
}
