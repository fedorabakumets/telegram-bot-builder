import { useState, useEffect, useMemo, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BotData, BotGroup } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
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
      loadedFormatsRef.current.clear(); // Очищаем отслеживание загруженных форматов
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
    
    // Проверяем, был ли уже загружен этот формат (используем ref для проверки без ререндера)
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
        loadedFormatsRef.current.add(selectedFormat); // Отмечаем как загруженный
      } catch (error) {
        console.error('❌ CodePanel: Ошибка загрузки:', error);
        toast({
          title: "Ошибка генерации",
          description: "Не удалось сгенерировать код.",
          variant: "destructive",
        });
        setCodeContent(prev => ({ 
          ...prev, 
          [selectedFormat]: `# Ошибка генерации\n# ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` 
        }));
      } finally {
        setIsLoading(false);
      }
    }
    
    loadContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFormat, botData, projectName, groups, toast]);

  const highlightedLines = new Set<number>();

  const getCurrentContent = (): string => {
    if (isLoading) {
      return 'Генерация кода...';
    }
    const content = codeContent?.[selectedFormat];
    if (content === undefined || content === null) {
      return 'Выберите формат для просмотра кода...';
    }
    return content;
  };

  // Вспомогательная функция для генерации контента (используется в useEffect и downloadFile)
  const generateContent = async (format: CodeFormat): Promise<string> => {
    try {
      const botGenerator = await loadBotGenerator();
      
      switch (format) {
        case 'python':
          const validation = botGenerator.validateBotStructure(botData);
          if (!validation?.isValid) {
            const errorMsg = validation?.errors?.join('\n') || 'Неизвестная ошибка';
            console.warn('Validation errors:', errorMsg);
            return `# Ошибка валидации структуры бота\n# ${errorMsg}`;
          }
          const pythonCode = botGenerator.generatePythonCode(botData, projectName, groups || []);
          return pythonCode || '# Ошибка генерации Python кода';
        case 'json':
          return JSON.stringify(botData, null, 2);
        case 'requirements':
          const reqContent = botGenerator.generateRequirementsTxt();
          return reqContent || '';
        case 'readme':
          const readmeContent = botGenerator.generateReadme(botData, projectName);
          return readmeContent || '';
        case 'dockerfile':
          const dockerfileContent = botGenerator.generateDockerfile();
          return dockerfileContent || '';
        default:
          return '';
      }
    } catch (error) {
      console.error('Error generating content:', error);
      return `# Ошибка генерации\n# ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
    }
  };

  const copyToClipboard = () => {
    const text = getCurrentContent();
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано!",
      description: "Код скопирован в буфер обмена",
    });
  };

  const downloadFile = async (format: CodeFormat) => {
    let content = codeContent[format];
    // Если контента нет, генерируем его
    if (!content) {
      try {
        content = await generateContent(format);
        // Сохраняем в кеш и отмечаем как загруженный
        setCodeContent(prev => ({ ...prev, [format]: content }));
        loadedFormatsRef.current.add(format);
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
    link.download = fileNames[format] + fileExtensions[format];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Файл скачан",
      description: `Файл ${link.download} успешно загружен`,
    });
  };

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
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted-foreground">
              {selectedFormat === 'python' ? 'Python' : 
               selectedFormat === 'json' ? 'JSON' :
               selectedFormat === 'requirements' ? 'Requirements' :
               selectedFormat === 'readme' ? 'README' : 'Dockerfile'}
              {selectedNodeId && selectedFormat === 'python' && highlightedLines.size > 0 && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (выделен узел: {selectedNodeId})
                </span>
              )}
            </span>
            <div className="flex gap-2">
              <Button
                onClick={copyToClipboard}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                data-testid="button-copy-code"
              >
                <i className="fas fa-copy mr-1"></i>
                Копировать
              </Button>
              <Button
                onClick={() => downloadFile(selectedFormat)}
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                data-testid="button-download-code"
              >
                <i className="fas fa-download mr-1"></i>
                Скачать
              </Button>
            </div>
          </div>
          
          <div 
            className="flex-1 overflow-auto rounded border border-slate-300 dark:border-slate-700"
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Генерация кода...</p>
                </div>
              </div>
            ) : (() => {
              const content = getCurrentContent();
              const lineCount = content.split('\n').length;
              const isLargeFile = lineCount > 1000;
              
              // Для большого Python кода используем Textarea (быстрее, чем SyntaxHighlighter)
              if (selectedFormat === 'python' && isLargeFile) {
                return (
                  <div className="flex flex-col h-full">
                    <div className="px-3 py-2 bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-900/30">
                      <p className="text-xs text-yellow-800 dark:text-yellow-200">
                        Большой файл ({lineCount} строк). Синтаксис отключен для производительности.
                      </p>
                    </div>
                    <Textarea
                      value={content}
                      readOnly
                      className="flex-1 font-mono text-xs bg-transparent border-0 resize-none focus:outline-none"
                      style={{
                        lineHeight: '1.5',
                        letterSpacing: '0.02em',
                        tabSize: 4
                      }}
                      data-testid="textarea-code-preview"
                    />
                  </div>
                );
              }
              
              // Для малых файлов или других форматов используем SyntaxHighlighter
              if (selectedFormat === 'python') {
                return (
                  <SyntaxHighlighter
                    language="python"
                    style={theme === 'dark' ? vscDarkPlus : vs}
                    showLineNumbers={true}
                    wrapLines={true}
                    lineProps={(lineNumber) => {
                      const isHighlighted = highlightedLines.has(lineNumber);
                      return {
                        style: {
                          backgroundColor: isHighlighted 
                            ? (theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)')
                            : 'transparent',
                          display: 'block',
                          width: '100%',
                          transition: 'background-color 0.3s ease'
                        }
                      };
                    }}
                    customStyle={{
                      margin: 0,
                      fontSize: '12px',
                      lineHeight: '1.5',
                      background: 'transparent'
                    }}
                    data-testid="syntax-highlighter-python"
                  >
                    {content}
                  </SyntaxHighlighter>
                );
              }
              
              // Для других форматов
              return (
                <Textarea
                  value={content}
                  readOnly
                  className="w-full h-full font-mono text-xs bg-transparent border-0 resize-none focus:outline-none"
                  style={{
                    lineHeight: '1.5',
                    letterSpacing: '0.02em',
                    tabSize: 4
                  }}
                  placeholder="Выберите формат для просмотра кода..."
                  data-testid="textarea-code-preview"
                />
              );
            })()}
          </div>
        </div>
      </div>
    </aside>
  );
}
