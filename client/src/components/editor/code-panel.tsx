import { useState, useEffect, useMemo, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BotData, BotGroup } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';

const loadBotGenerator = () => import('@/lib/bot-generator');

interface CodePanelProps {
  botData: BotData;
  projectName: string;
  projectId: number;
  selectedNodeId?: string | null;
}

type CodeFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile';

export function CodePanel({ botData, projectName, projectId, selectedNodeId }: CodePanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<CodeFormat>('python');
  const [codeContent, setCodeContent] = useState<Record<CodeFormat, string>>({
    python: '',
    json: '',
    requirements: '',
    readme: '',
    dockerfile: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [areAllCollapsed, setAreAllCollapsed] = useState(true);
  const editorRef = useRef<any>(null);
  const { toast } = useToast();

  const { data: groups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups'],
  });

  // Отслеживаем предыдущие значения для обнаружения реальных изменений  
  const prevDataRef = useRef({ 
    botDataStr: JSON.stringify(botData), 
    projectName,
    groupsStr: JSON.stringify(groups)
  });
  
  // Отслеживаем, какие форматы уже загружены
  const loadedFormatsRef = useRef(new Set<CodeFormat>());

  // Определяем тему из DOM
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Функция для сворачивания/разворачивания всех функций
  const toggleAllFunctions = () => {
    if (editorRef.current) {
      const editor = editorRef.current;
      if (areAllCollapsed) {
        // Развернуть все
        editor.getAction('editor.unfoldAll')?.run();
        setAreAllCollapsed(false);
      } else {
        // Свернуть все
        editor.getAction('editor.foldAll')?.run();
        setAreAllCollapsed(true);
      }
    }
  };

  const generateContent = async (format: CodeFormat): Promise<string> => {
    try {
      const botGenerator = await loadBotGenerator();
      
      switch (format) {
        case 'python':
          return botGenerator.generatePythonCode(botData, projectName, groups);
        case 'json':
          return JSON.stringify(botData, null, 2);
        case 'requirements':
          return botGenerator.generateRequirementsTxt();
        case 'readme':
          return botGenerator.generateReadme(botData, projectName);
        case 'dockerfile':
          return botGenerator.generateDockerfile();
        default:
          return '';
      }
    } catch (error) {
      console.error('Error generating content:', error);
      return `# Ошибка генерации\n# ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
    }
  };

  const getCurrentContent = () => {
    return codeContent[selectedFormat] || '';
  };

  const copyToClipboard = () => {
    const text = getCurrentContent();
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано!",
      description: "Код скопирован в буфер обмена",
    });
  };

  const downloadFile = async () => {
    let content = codeContent[selectedFormat];
    // Если контента нет, генерируем его
    if (!content) {
      try {
        content = await generateContent(selectedFormat);
        setCodeContent(prev => ({ ...prev, [selectedFormat]: content }));
        loadedFormatsRef.current.add(selectedFormat);
      } catch (error) {
        console.error('❌ downloadFile: Ошибка генерации:', error);
        toast({
          title: "Ошибка генерации",
          description: "Не удалось сгенерировать файл для скачивания.",
          variant: "destructive",
        });
        return;
      }
    }
    if (!content) return;

    const fileExtensions: Record<CodeFormat, string> = {
      python: '.py',
      json: '.json',
      requirements: '.txt',
      readme: '.md',
      dockerfile: ''
    };

    const fileNames: Record<CodeFormat, string> = {
      python: 'bot',
      json: 'bot_data',
      requirements: 'requirements',
      readme: 'README',
      dockerfile: 'Dockerfile'
    };

    const blob = new Blob([content as string], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileNames[selectedFormat] + fileExtensions[selectedFormat];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Файл скачан",
      description: `Файл ${link.download} успешно загружен`,
    });
  };

  // Объединенная логика: сброс кеша при изменении данных + загрузка контента
  useEffect(() => {
    // Проверяем, изменились ли данные (сравниваем по значению, а не по ссылке)
    const prev = prevDataRef.current;
    const currentBotDataStr = JSON.stringify(botData);
    const currentGroupsStr = JSON.stringify(groups);
    const dataChanged = prev.botDataStr !== currentBotDataStr || 
                       prev.projectName !== projectName || 
                       prev.groupsStr !== currentGroupsStr;
    
    if (dataChanged) {
      console.log('🔄 CodePanel: Данные изменились, сбрасываем весь кеш');
      setCodeContent({
        python: '',
        json: '',
        requirements: '',
        readme: '',
        dockerfile: ''
      });
      loadedFormatsRef.current.clear();
      prevDataRef.current = { 
        botDataStr: currentBotDataStr, 
        projectName, 
        groupsStr: currentGroupsStr 
      };
    }
    
    if (!botData) {
      console.warn('⚠️ CodePanel: Нет данных бота');
      return;
    }
    
    // Проверяем, был ли уже загружен этот формат
    if (loadedFormatsRef.current.has(selectedFormat)) {
      console.log('✅ CodePanel: Контент уже загружен для', selectedFormat, '- пропускаем');
      return;
    }
    
    // Генерируем контент
    async function loadContent() {
      console.log('🔄 CodePanel: Генерация контента для', selectedFormat);
      setIsLoading(true);
      
      try {
        const content = await generateContent(selectedFormat);
        
        console.log('✅ CodePanel: Контент загружен для', selectedFormat);
        setCodeContent(prev => ({ ...prev, [selectedFormat]: content }));
        loadedFormatsRef.current.add(selectedFormat);
      } catch (error) {
        console.error('❌ CodePanel: Ошибка загрузки:', error);
        toast({
          title: "Ошибка генерации",
          description: "Не удалось сгенерировать код.",
          variant: "destructive",
        });
        setCodeContent(prev => ({ 
          ...prev, 
          [selectedFormat]: `# Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
        }));
        loadedFormatsRef.current.add(selectedFormat);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadContent();
  }, [selectedFormat, botData, projectName, groups]);

  const content = getCurrentContent();
  const lineCount = content.split('\n').length;

  return (
    <aside className="w-full h-full bg-background border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center mr-3">
              <i className="fas fa-code text-purple-600 dark:text-purple-400 text-sm"></i>
            </div>
            <h2 className="text-sm font-semibold text-foreground">Код проекта</h2>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-3">Предварительный просмотр сгенерированного кода</p>
        
        <div className="space-y-3">
          <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as CodeFormat)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python">
                <div className="flex items-center">
                  <i className="fab fa-python mr-2 text-blue-500"></i>
                  Python код
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center">
                  <i className="fas fa-database mr-2 text-green-500"></i>
                  JSON данные
                </div>
              </SelectItem>
              <SelectItem value="requirements">
                <div className="flex items-center">
                  <i className="fas fa-list mr-2 text-orange-500"></i>
                  Requirements.txt
                </div>
              </SelectItem>
              <SelectItem value="readme">
                <div className="flex items-center">
                  <i className="fas fa-file-alt mr-2 text-purple-500"></i>
                  README.md
                </div>
              </SelectItem>
              <SelectItem value="dockerfile">
                <div className="flex items-center">
                  <i className="fab fa-docker mr-2 text-cyan-500"></i>
                  Dockerfile
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex-1"
              data-testid="button-copy-code"
            >
              <i className="fas fa-copy mr-2"></i>
              Копировать
            </Button>
            <Button
              onClick={downloadFile}
              variant="outline"
              size="sm"
              className="flex-1"
              data-testid="button-download-code"
            >
              <i className="fas fa-download mr-2"></i>
              Скачать
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4 flex flex-col">
        {lineCount > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-2 mb-2">
            <div className="flex items-center gap-2">
              <span>Строк: {lineCount}</span>
              {(selectedFormat === 'python' || selectedFormat === 'json') && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={toggleAllFunctions}
                  className="h-6 px-2 text-xs"
                  data-testid="button-toggle-all-functions"
                >
                  <i className={`fas ${areAllCollapsed ? 'fa-expand' : 'fa-compress'} mr-1`}></i>
                  {areAllCollapsed ? 'Развернуть всё' : 'Свернуть всё'}
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden rounded border border-slate-300 dark:border-slate-700">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Генерация кода...</p>
              </div>
            </div>
          ) : (
            <Editor
              value={content}
              language={
                selectedFormat === 'python' ? 'python' :
                selectedFormat === 'json' ? 'json' :
                selectedFormat === 'readme' ? 'markdown' :
                selectedFormat === 'dockerfile' ? 'dockerfile' :
                'plaintext'
              }
              theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
              onMount={(editor) => {
                editorRef.current = editor;
                if (selectedFormat === 'python' || selectedFormat === 'json') {
                  setTimeout(() => {
                    editor.getAction('editor.foldAll')?.run();
                    setAreAllCollapsed(true);
                  }, 100);
                }
              }}
              options={{
                readOnly: true,
                lineNumbers: 'on',
                wordWrap: 'on',
                fontSize: 12,
                lineHeight: 1.5,
                minimap: { enabled: lineCount > 500 },
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
        </div>
      </div>
    </aside>
  );
}
