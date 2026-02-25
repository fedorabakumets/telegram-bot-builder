/**
 * @fileoverview Компонент предпросмотра README с разделённой панелью
 *
 * Предоставляет возможность просмотра README в режимах:
 * - Только редактор
 * - Только превью
 * - Разделённый экран: слева Monaco editor, справа превью
 *
 * @module ReadmePreview
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReadmeRenderer } from './readme-renderer';

interface ReadmePreviewProps {
  markdownContent: string;
  onContentChange?: (content: string) => void;
  theme?: string;
}

/**
 * Компонент предпросмотра README с разделённой панелью
 */
export function ReadmePreview({ markdownContent, onContentChange, theme }: ReadmePreviewProps) {
  const [splitRatio, setSplitRatio] = useState(50);
  const [viewMode, setViewMode] = useState<'editor' | 'preview' | 'split'>('split');
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [localContent, setLocalContent] = useState(markdownContent);

  const editorRef = useRef<any>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  // Обновляем локальный контент при изменении пропса
  useEffect(() => {
    setLocalContent(markdownContent);
  }, [markdownContent]);

  // Очистка обработчиков при размонтировании
  useEffect(() => {
    return () => {
      const editor = editorRef.current;
      if (!editor) return;
      
      const domNode = editor.getDomNode();
      if (!domNode) return;
      
      const scrollElement = domNode.querySelector('.monaco-scrollable-element.editor-scrollable');
      if (scrollElement) {
        // Клонируем для удаления всех обработчиков
        const newElement = scrollElement.cloneNode(true);
        scrollElement.parentNode?.replaceChild(newElement, scrollElement);
      }
    };
  }, []);

  /**
   * Обработчик изменения контента
   */
  const handleEditorChange = useCallback((value?: string) => {
    if (value !== undefined) {
      setLocalContent(value);
      onContentChange?.(value);
    }
  }, [onContentChange]);

  /**
   * Синхронизация прокрутки preview -> editor
   */
  const handlePreviewScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isSyncingRef.current || !editorRef.current || !previewScrollRef.current) return;

    isSyncingRef.current = true;
    const target = e.currentTarget;
    const scrollPercentage = target.scrollTop / (target.scrollHeight - target.clientHeight || 1);

    const editor = editorRef.current;
    const scrollHeight = editor.getScrollHeight();
    const height = editor.getLayoutInfo().height;
    const maxScrollTop = scrollHeight - height;
    editor.setScrollTop(scrollPercentage * maxScrollTop);

    setTimeout(() => {
      isSyncingRef.current = false;
    }, 10);
  }, []);

  /**
   * Обработчик изменения размера панелей
   */
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  /**
   * Обработчик движения мыши при изменении размера
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return;
    
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const newRatio = ((e.clientX - rect.left) / rect.width) * 100;
    
    if (newRatio >= 20 && newRatio <= 80) {
      setSplitRatio(newRatio);
    }
  }, [isResizing]);

  /**
   * Обработчик окончания изменения размера
   */
  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Глобальные обработчики для изменения размера
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  if (viewMode === 'editor') {
    return (
      <Card className="h-full flex flex-col">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="text-sm text-muted-foreground">Редактор README</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('split')}
              title="Разделённый вид"
            >
              <i className="fas fa-columns"></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('preview')}
              title="Режим превью"
            >
              <i className="fas fa-eye"></i>
            </Button>
          </div>
        </div>
        <CardContent className="flex-1 p-0 overflow-hidden">
          <Editor
            value={localContent}
            language="markdown"
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            onMount={(editor) => {
              editorRef.current = editor;
              
              // Ждём пока редактор отрендерится
              setTimeout(() => {
                const domNode = editor.getDomNode();
                if (!domNode) return;
                
                // Находим скролл контейнер Monaco
                const scrollElement = domNode.querySelector('.monaco-scrollable-element.editor-scrollable');
                if (!scrollElement) return;
                
                scrollElement.addEventListener('scroll', () => {
                  if (isSyncingRef.current || !previewScrollRef.current) return;

                  isSyncingRef.current = true;
                  const scrollTop = editor.getScrollTop();
                  const scrollHeight = editor.getScrollHeight();
                  const height = editor.getLayoutInfo().height;
                  const maxScrollTop = scrollHeight - height;
                  const scrollPercentage = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;

                  previewScrollRef.current.scrollTop = scrollPercentage *
                    (previewScrollRef.current.scrollHeight - previewScrollRef.current.clientHeight);

                  setTimeout(() => {
                    isSyncingRef.current = false;
                  }, 10);
                }, { passive: true });
              }, 100);
            }}
            onChange={handleEditorChange}
            options={{
              wordWrap: 'on',
              fontSize: 14,
              minimap: { enabled: false },
              lineNumbers: 'off',
              folding: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </CardContent>
      </Card>
    );
  }

  if (viewMode === 'preview') {
    return (
      <Card className="h-full flex flex-col">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="text-sm text-muted-foreground">Предпросмотр README</span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('split')}
              title="Разделённый вид"
            >
              <i className="fas fa-columns"></i>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode('editor')}
              title="Режим редактора"
            >
              <i className="fas fa-edit"></i>
            </Button>
          </div>
        </div>
        <CardContent className="flex-1 overflow-auto p-0" ref={previewScrollRef} onScroll={handlePreviewScroll}>
          <div className="p-4 sm:p-6">
            <ReadmeRenderer content={markdownContent} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Разделённый вид: слева Monaco editor, справа превью
  return (
    <Card className="h-full flex flex-col" ref={containerRef}>
      <div className="flex items-center justify-between p-2 border-b">
        <span className="text-sm text-muted-foreground">Предпросмотр README</span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('editor')}
            title="Только редактор"
          >
            <i className="fas fa-edit"></i>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode('preview')}
            title="Только превью"
          >
            <i className="fas fa-eye"></i>
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Левая панель: Monaco editor */}
        <div
          className="overflow-hidden"
          style={{ width: `${splitRatio}%` }}
        >
          <Editor
            value={localContent}
            language="markdown"
            theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
            onMount={(editor) => {
              editorRef.current = editor;
              
              // Ждём пока редактор отрендерится
              setTimeout(() => {
                const domNode = editor.getDomNode();
                if (!domNode) return;
                
                // Находим скролл контейнер Monaco
                const scrollElement = domNode.querySelector('.monaco-scrollable-element.editor-scrollable');
                if (!scrollElement) return;
                
                scrollElement.addEventListener('scroll', () => {
                  if (isSyncingRef.current || !previewScrollRef.current) return;

                  isSyncingRef.current = true;
                  const scrollTop = editor.getScrollTop();
                  const scrollHeight = editor.getScrollHeight();
                  const height = editor.getLayoutInfo().height;
                  const maxScrollTop = scrollHeight - height;
                  const scrollPercentage = maxScrollTop > 0 ? scrollTop / maxScrollTop : 0;

                  previewScrollRef.current.scrollTop = scrollPercentage *
                    (previewScrollRef.current.scrollHeight - previewScrollRef.current.clientHeight);

                  setTimeout(() => {
                    isSyncingRef.current = false;
                  }, 10);
                }, { passive: true });
              }, 100);
            }}
            onChange={handleEditorChange}
            options={{
              wordWrap: 'on',
              fontSize: 14,
              minimap: { enabled: false },
              lineNumbers: 'off',
              folding: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </div>

        {/* Разделитель */}
        <div
          className="w-1 bg-border hover:bg-primary cursor-col-resize flex-shrink-0 transition-colors"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-center h-full">
            <div className="w-0.5 h-8 bg-muted-foreground/50 rounded"></div>
          </div>
        </div>

        {/* Правая панель: превью */}
        <div
          className="overflow-auto"
          style={{ width: `${100 - splitRatio}%` }}
          ref={previewScrollRef}
          onScroll={handlePreviewScroll}
        >
          <div className="p-4 sm:p-6">
            <ReadmeRenderer content={markdownContent} />
          </div>
        </div>
      </div>
    </Card>
  );
}
