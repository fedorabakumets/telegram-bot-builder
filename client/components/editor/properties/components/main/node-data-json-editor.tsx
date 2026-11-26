/**
 * @fileoverview Компактный JSON-редактор данных узла с кнопкой копирования под полем ввода в панели свойств
 * @module components/editor/properties/components/main/node-data-json-editor
 */

import { useEffect, useRef } from 'react';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { copyTextToClipboard } from '@/utils/copy-text';
import Editor from '@monaco-editor/react';
import { useTheme } from '@/components/editor/header/utils/theme-provider';

/** Свойства компонента NodeDataJsonEditor */
interface NodeDataJsonEditorProps {
  /** Текущий черновик JSON */
  value: string;
  /** Текст ошибки парсинга или null */
  error: string | null;
  /** Колбэк изменения текста */
  onChange: (value: string) => void;
  /** Колбэк применения по Ctrl+S */
  onApply: () => void;
}

/**
 * Monaco-редактор для raw JSON объекта node.data
 * @param props - Свойства компонента
 * @returns JSX элемент редактора
 */
export function NodeDataJsonEditor({ value, error, onChange, onApply }: NodeDataJsonEditorProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  /** Копирует текущий текст редактора, включая неприменённые правки. */
  async function copyDraft() {
    const copied = await copyTextToClipboard(value);
    toast({
      title: copied ? 'JSON скопирован' : 'Не удалось скопировать JSON',
      variant: copied ? 'default' : 'destructive',
    });
  }

  /** Ctrl+S — применить JSON */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onApply();
      }
    };
    const el = containerRef.current;
    el?.addEventListener('keydown', handler);
    return () => el?.removeEventListener('keydown', handler);
  }, [onApply]);

  return (
    <div ref={containerRef} className="flex h-full min-h-[240px] min-w-0 flex-col gap-2 px-3 py-2" tabIndex={-1}>
      {error && (
        <div
          className="px-3 py-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg shrink-0"
          role="alert"
          data-testid="properties-json-error"
        >
          {error}
        </div>
      )}
      <div className="min-h-0 min-w-0 flex-1">
        <Editor
          value={value}
          language="json"
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          options={{
            readOnly: false,
            lineNumbers: 'off',
            wordWrap: 'on',
            fontSize: 12,
            lineHeight: 1.5,
            minimap: { enabled: false },
            folding: true,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            formatOnPaste: true,
            tabSize: 2,
          }}
          onChange={(v) => onChange(v ?? '')}
          data-testid="properties-node-data-json-editor"
        />
      </div>
      <div className="flex shrink-0 justify-start">
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1.5 px-2 text-xs" onClick={copyDraft}>
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
          Скопировать JSON
        </Button>
      </div>
    </div>
  );
}
