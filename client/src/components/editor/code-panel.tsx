import { useState, useEffect, useMemo, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BotData, BotGroup } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const codeContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: groups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups'],
  });

  // Определяем тему из DOM
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };
    
    checkTheme();
    
    // Наблюдаем за изменениями темы
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const generateCodeContent = useMemo(() => {
    if (!botData) return {};
    
    return {
      python: async () => {
        const botGenerator = await loadBotGenerator();
        const validation = botGenerator.validateBotStructure(botData);
        if (!validation?.isValid) return '// Ошибка валидации структуры бота';
        return botGenerator.generatePythonCode(botData, projectName, groups);
      },
      json: async () => JSON.stringify(botData, null, 2),
      requirements: async () => {
        const botGenerator = await loadBotGenerator();
        return botGenerator.generateRequirementsTxt();
      },
      readme: async () => {
        const botGenerator = await loadBotGenerator();
        return botGenerator.generateReadme(botData, projectName);
      },
      dockerfile: async () => {
        const botGenerator = await loadBotGenerator();
        return botGenerator.generateDockerfile();
      }
    };
  }, [botData, projectName, groups]);

  // Сбрасываем кеш кода при изменении данных бота
  useEffect(() => {
    setCodeContent({
      python: '',
      json: '',
      requirements: '',
      readme: '',
      dockerfile: ''
    });
  }, [botData, projectName, groups]);

  useEffect(() => {
    console.log('🔧 useEffect triggered, selectedFormat:', selectedFormat);
    console.log('🔧 codeContent[selectedFormat]:', codeContent[selectedFormat]?.substring(0, 50) || '<empty>');
    
    // Добавляем задержку для оптимизации производительности
    const timeoutId = setTimeout(async () => {
      console.log('🔧 Timeout fired for format:', selectedFormat);
      
      if (!generateCodeContent[selectedFormat]) {
        console.log('⚠️ No generator for format:', selectedFormat);
        return;
      }
      
      // Проверяем, есть ли уже загруженный контент
      if (codeContent[selectedFormat]) {
        console.log('✅ Content already loaded, skipping generation');
        return;
      }
      
      console.log('🚀 Starting code generation for', selectedFormat);
      try {
        const content = await generateCodeContent[selectedFormat]();
        console.log('✅ Generation complete, setting content');
        setCodeContent(prev => ({ ...prev, [selectedFormat]: content }));
      } catch (error) {
        console.error('❌ Error loading code content:', error);
      }
    }, 500); // Задержка 500мс для debounce
    
    return () => {
      console.log('🧹 Cleanup timeout for', selectedFormat);
      clearTimeout(timeoutId);
    };
  }, [generateCodeContent, selectedFormat, codeContent]);

  // Подсветка строк убрана для упрощения и производительности
  const highlightedLines = new Set<number>();

  const getCurrentContent = () => {
    return codeContent[selectedFormat] || 'Загрузка...';
  };
  
  const [displayContent, setDisplayContent] = useState<string>('Загрузка...');
  
  // Обновляем отображаемый контент когда меняется формат или контент
  useEffect(() => {
    setDisplayContent(getCurrentContent());
  }, [codeContent, selectedFormat]);

  const copyToClipboard = () => {
    const text = getCurrentContent();
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопировано!",
      description: "Код скопирован в буфер обмена",
    });
  };

  const downloadFile = async (format: CodeFormat) => {
    const content = codeContent[format] || await generateCodeContent[format]?.();
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
            ref={codeContainerRef}
            className="flex-1 overflow-auto rounded border border-slate-300 dark:border-slate-700"
          >
            {selectedFormat === 'python' ? (
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
                {displayContent}
              </SyntaxHighlighter>
            ) : (
              <Textarea
                value={displayContent}
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
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
