import { MutableRefObject } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

// Тип для Monaco Editor с минимальным интерфейсом, необходимым для нашего использования
interface MonacoEditor {
  getAction: (action: string) => { run: () => Promise<void> } | null;
  focus: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
  getModel: () => any;
  updateOptions: (options: any) => void;
  dispose: () => void;
}

// Тип для статистики кода
interface CodeStats {
  totalLines: number;
  truncated: boolean;
  functions: number;
  classes: number;
  comments: number;
}

interface CodeEditorAreaProps {
  isMobile: boolean;
  isLoading: boolean;
  displayContent: string;
  selectedFormat: string;
  theme: string;
  editorRef: MutableRefObject<MonacoEditor | null>;
  codeStats: CodeStats;
  setAreAllCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  areAllCollapsed?: boolean;
}

export function CodeEditorArea({
  isLoading,
  displayContent,
  selectedFormat,
  theme,
  editorRef,
  codeStats,
  setAreAllCollapsed,
  areAllCollapsed
}: CodeEditorAreaProps) {
  return <Card className="border border-border/50 shadow-sm overflow-hidden h-full flex flex-col">
    <CardContent className="p-0 flex-1 flex flex-col h-full">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Генерация кода...</p>
          </div>
        </div>
      ) : (
        <Editor
          value={displayContent}
          language={
            selectedFormat === 'python' ? 'python' :
            selectedFormat === 'json' ? 'json' :
            selectedFormat === 'readme' ? 'markdown' :
            selectedFormat === 'dockerfile' ? 'dockerfile' :
            selectedFormat === 'config' ? 'yaml' :
            'plaintext'
          }
          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
          onMount={(editor) => {
            editorRef.current = editor;
            if ((selectedFormat === 'python' || selectedFormat === 'json') && codeStats.totalLines > 0) {
              const currentCollapseState = areAllCollapsed;
              setTimeout(() => {
                if (currentCollapseState) {
                  editor.getAction('editor.foldAll')?.run();
                } else {
                  editor.getAction('editor.unfoldAll')?.run();
                }
                setAreAllCollapsed(!!currentCollapseState);
              }, 100);
            }
          }}
          options={{
            readOnly: true,
            lineNumbers: 'on',
            wordWrap: 'on',
            fontSize: 12,
            lineHeight: 1.5,
            minimap: { enabled: codeStats.totalLines > 500 },
            folding: true,
            foldingHighlight: true,
            foldingStrategy: 'auto',
            showFoldingControls: 'always',
            glyphMargin: true,
            scrollBeyondLastLine: false,
            padding: { top: 8, bottom: 8 },
            automaticLayout: true,
            contextmenu: false,
            bracketPairColorization: {
              enabled: selectedFormat === 'json'
            },
            formatOnPaste: false,
            formatOnType: false
          }}
          data-testid={`monaco-editor-code-${selectedFormat}`}
        />
      )}
    </CardContent>
  </Card>;
}