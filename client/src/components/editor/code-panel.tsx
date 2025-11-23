import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
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

type CodeFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'config';

export function CodePanel({ botData, projectName, projectId, selectedNodeId }: CodePanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<CodeFormat>('python');
  const [codeContent, setCodeContent] = useState<Record<CodeFormat, string>>({
    python: '',
    json: '',
    requirements: '',
    readme: '',
    dockerfile: '',
    config: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [areAllCollapsed, setAreAllCollapsed] = useState(true);
  const [showFullCode, setShowFullCode] = useState(false);
  const editorRef = useRef<any>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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
        case 'config':
          return botGenerator.generateConfigYaml(projectName);
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
      dockerfile: '',
      config: '.yaml'
    };

    const fileNames: Record<CodeFormat, string> = {
      python: 'bot',
      json: 'bot_data',
      requirements: 'requirements',
      readme: 'README',
      dockerfile: 'Dockerfile',
      config: 'config'
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
        dockerfile: '',
        config: ''
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
    
    if (loadedFormatsRef.current.has(selectedFormat)) {
      console.log('✅ CodePanel: Контент уже загружен для', selectedFormat, '- пропускаем');
      return;
    }
    
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
  const lines = content.split('\n');
  const lineCount = lines.length;
  const MAX_VISIBLE_LINES = 1000;
  const displayContent = useMemo(() => {
    if (!showFullCode && lines.length > MAX_VISIBLE_LINES) {
      return lines.slice(0, MAX_VISIBLE_LINES).join('\n');
    }
    return content;
  }, [content, showFullCode]);

  const codeStats = useMemo(() => {
    return {
      totalLines: lineCount,
      truncated: !showFullCode && lineCount > 1000,
      functions: (content.match(/^def |^async def /gm) || []).length,
      classes: (content.match(/^class /gm) || []).length,
      comments: (content.match(/^[^#]*#/gm) || []).length
    };
  }, [content, showFullCode]);

  const getFormatIcon = (format: CodeFormat) => {
    const icons = {
      python: 'fab fa-python text-blue-500',
      json: 'fas fa-database text-green-500',
      requirements: 'fas fa-list text-orange-500',
      readme: 'fas fa-file-alt text-purple-500',
      dockerfile: 'fab fa-docker text-cyan-500',
      config: 'fas fa-cog text-yellow-500'
    };
    return icons[format];
  };

  const getFormatLabel = (format: CodeFormat) => {
    const labels = {
      python: 'Python код',
      json: 'JSON данные',
      requirements: 'Requirements.txt',
      readme: 'README.md',
      dockerfile: 'Dockerfile',
      config: 'Config YAML'
    };
    return labels[format];
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Заголовок */}
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                <i className="fas fa-code text-purple-600 dark:text-purple-400"></i>
              </div>
              <span>Код проекта</span>
            </h1>
            <p className="text-muted-foreground mt-1">Предварительный просмотр и загрузка сгенерированного кода</p>
          </div>

          {/* Карточка с выбором формата и статистикой */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <i className={`${getFormatIcon(selectedFormat)}`}></i>
                <span>{getFormatLabel(selectedFormat)}</span>
              </CardTitle>
              <CardDescription>Выберите формат для просмотра и загрузки</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Выбор формата */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Формат файла:</label>
                <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as CodeFormat)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="python">
                      <div className="flex items-center">
                        <i className="fab fa-python mr-2 text-blue-500"></i>
                        Python код (.py)
                      </div>
                    </SelectItem>
                    <SelectItem value="json">
                      <div className="flex items-center">
                        <i className="fas fa-database mr-2 text-green-500"></i>
                        JSON данные (.json)
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
                    <SelectItem value="config">
                      <div className="flex items-center">
                        <i className="fas fa-cog mr-2 text-yellow-500"></i>
                        Config YAML (.yaml)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Кнопки действий */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="w-full"
                  data-testid="button-copy-code"
                >
                  <i className="fas fa-copy mr-2"></i>
                  Копировать
                </Button>
                <Button
                  onClick={downloadFile}
                  className="w-full"
                  data-testid="button-download-code"
                >
                  <i className="fas fa-download mr-2"></i>
                  Скачать
                </Button>
              </div>

              {/* Статистика кода */}
              {lineCount > 0 && (
                <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-2`}>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{codeStats.totalLines}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300">Строк</div>
                  </div>
                  {selectedFormat === 'python' && codeStats.functions > 0 && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-green-600 dark:text-green-400">{codeStats.functions}</div>
                      <div className="text-xs text-green-700 dark:text-green-300">Функций</div>
                    </div>
                  )}
                  {selectedFormat === 'python' && codeStats.classes > 0 && (
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{codeStats.classes}</div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">Классов</div>
                    </div>
                  )}
                  {selectedFormat === 'json' && (
                    <div className="bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-2 text-center">
                      <div className="text-lg font-bold text-cyan-600 dark:text-cyan-400">{(content.match(/"/g) || []).length / 2}</div>
                      <div className="text-xs text-cyan-700 dark:text-cyan-300">Ключей</div>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              {/* Информация о коде */}
              {codeStats.totalLines > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Размер: {Math.round(content.length / 1024)} KB</span>
                    {(selectedFormat === 'python' || selectedFormat === 'json') && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={toggleAllFunctions}
                        className="h-6 px-2 text-xs"
                        data-testid="button-toggle-all-functions"
                      >
                        <i className={`fas ${areAllCollapsed ? 'fa-expand' : 'fa-compress'} mr-1`}></i>
                        {areAllCollapsed ? 'Развернуть' : 'Свернуть'}
                      </Button>
                    )}
                  </div>
                  {codeStats.truncated && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowFullCode(true)}
                      data-testid="button-show-full-code"
                    >
                      Показать всё ({codeStats.totalLines})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Редактор кода */}
          <Card>
            <CardContent className={`p-0 ${isMobile ? 'h-48' : 'h-[500px]'}`}>
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
          </Card>
        </div>
      </div>
    </div>
  );
}
