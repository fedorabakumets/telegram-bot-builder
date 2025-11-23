import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { BotData, BotGroup } from '@shared/schema';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Loader2 } from 'lucide-react';
import { CodeFormat, useCodeGenerator } from '@/hooks/use-code-generator';

// Динамический импорт для генерации команд BotFather
const loadCommands = () => import('@/lib/commands');

interface ExportPanelProps {
  botData: BotData;
  projectName: string;
  projectId: number;
}

export function ExportPanel({ botData, projectName, projectId }: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<CodeFormat>('python');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showFullCode, setShowFullCode] = useState(false);
  const [areAllCollapsed, setAreAllCollapsed] = useState(true);
  const [botFatherCommands, setBotFatherCommands] = useState('');
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });
  const editorRef = useRef<any>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const { data: groups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups'],
  });

  // Используем общий генератор кода
  const { codeContent, isLoading, loadContent, generateContent } = useCodeGenerator(botData, projectName, groups);

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

  // Загружаем контент для выбранного формата
  useEffect(() => {
    loadContent(selectedFormat);
  }, [selectedFormat, loadContent]);

  // Функция для сворачивания/разворачивания всех функций
  const toggleAllFunctions = () => {
    if (editorRef.current) {
      const editor = editorRef.current;
      if (areAllCollapsed) {
        editor.getAction('editor.unfoldAll')?.run();
        setAreAllCollapsed(false);
      } else {
        editor.getAction('editor.foldAll')?.run();
        setAreAllCollapsed(true);
      }
    }
  };

  // Загрузка и валидация для Python
  useEffect(() => {
    async function loadValidation() {
      if (selectedFormat === 'python') {
        try {
          const { validateBotStructure } = await import('@/lib/bot-generator');
          const validation = validateBotStructure(botData);
          setValidationResult(validation || { isValid: false, errors: [] });
        } catch (error) {
          console.error('Error validating bot structure:', error);
        }
      }
    }
    loadValidation();
  }, [selectedFormat, botData]);

  // Загрузка команд BotFather
  useEffect(() => {
    async function loadBotFatherCommands() {
      try {
        const commands = await loadCommands();
        
        let nodes: any[] = [];
        if ((botData as any).sheets && Array.isArray((botData as any).sheets)) {
          (botData as any).sheets.forEach((sheet: any) => {
            if (sheet.nodes && Array.isArray(sheet.nodes)) {
              nodes = nodes.concat(sheet.nodes);
            }
          });
        } else {
          nodes = botData.nodes || [];
        }

        const commandNodes = nodes.filter((node: any) => 
          (node.type === 'start' || node.type === 'command') && 
          node.data?.command &&
          (node.data?.showInMenu !== false)
        );
        
        const botFatherCmds = commands.generateBotFatherCommands(commandNodes);
        setBotFatherCommands(botFatherCmds);
      } catch (error) {
        console.error('Error loading BotFather commands:', error);
      }
    }
    
    loadBotFatherCommands();
  }, [botData]);

  // Статистика бота
  const botStats = useMemo(() => {
    const allNodes = Array.isArray((botData as any).sheets)
      ? (botData as any).sheets.reduce((acc: any[], sheet: any) => 
          acc.concat(sheet.nodes || []), [])
      : botData.nodes || [];
    
    return {
      totalNodes: allNodes.length,
      commandNodes: allNodes.filter((node: any) => node.type === 'start' || node.type === 'command').length,
      messageNodes: allNodes.filter((node: any) => node.type === 'message').length,
      photoNodes: allNodes.filter((node: any) => node.type === 'photo').length,
      keyboardNodes: allNodes.filter((node: any) => node.data?.keyboardType !== 'none').length,
      totalButtons: allNodes.reduce((sum: number, node: any) => sum + (node.data?.buttons?.length || 0), 0),
      commandsInMenu: allNodes.filter((node: any) => 
        (node.type === 'start' || node.type === 'command') && node.data?.showInMenu
      ).length,
      adminOnlyCommands: allNodes.filter((node: any) => 
        (node.type === 'start' || node.type === 'command') && node.data?.adminOnly
      ).length,
    };
  }, [botData]);

  const getCurrentContent = () => codeContent[selectedFormat] || '';
  
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
      truncated: !showFullCode && lineCount > 1000
    };
  }, [content, showFullCode]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getCurrentContent());
      toast({
        title: "Содержимое скопировано!",
        description: "Содержимое скопировано в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать содержимое в буфер обмена",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async () => {
    const fileExtensions: Record<CodeFormat, string> = {
      python: '.py',
      json: '.json',
      requirements: '.txt',
      readme: '.md',
      dockerfile: '',
      config: '.yaml'
    };

    const fileNames: Record<CodeFormat, string> = {
      python: `${projectName.replace(/\s+/g, '_')}_bot`,
      json: `${projectName.replace(/\s+/g, '_')}_data`,
      requirements: 'requirements',
      readme: 'README',
      dockerfile: 'Dockerfile',
      config: 'config'
    };

    const blob = new Blob([getCurrentContent()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileNames[selectedFormat] + fileExtensions[selectedFormat];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Файл загружен!",
      description: `Файл ${link.download} успешно загружен`,
    });
  };

  const downloadAllFiles = () => {
    const formats: CodeFormat[] = ['python', 'json', 'requirements', 'readme', 'dockerfile', 'config'];
    formats.forEach((format, index) => {
      setTimeout(async () => {
        const fileExtensions: Record<CodeFormat, string> = {
          python: '.py',
          json: '.json',
          requirements: '.txt',
          readme: '.md',
          dockerfile: '',
          config: '.yaml'
        };

        const fileNames: Record<CodeFormat, string> = {
          python: `${projectName.replace(/\s+/g, '_')}_bot`,
          json: `${projectName.replace(/\s+/g, '_')}_data`,
          requirements: 'requirements',
          readme: 'README',
          dockerfile: 'Dockerfile',
          config: 'config'
        };

        const content = await generateContent(format);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileNames[format] + fileExtensions[format];
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, index * 100);
    });
    
    toast({
      title: "Все файлы загружены!",
      description: "Полный проект бота загружен",
    });
  };

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
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Заголовок */}
          <div>
            <h1 className="text-2xl font-bold flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 flex items-center justify-center">
                <i className="fas fa-download text-blue-600 dark:text-blue-400"></i>
              </div>
              <span>Экспорт кода бота</span>
            </h1>
            <p className="text-muted-foreground mt-1">Загрузите готовый код бота и документацию для развертывания</p>
          </div>

          {/* Табы */}
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className={`grid w-full ${isMobile ? 'grid-cols-2 gap-1 h-auto' : 'grid-cols-4'}`}>
              <TabsTrigger value="stats" className={isMobile ? 'text-xs py-2' : ''}>Статистика</TabsTrigger>
              <TabsTrigger value="validation" className={isMobile ? 'text-xs py-2' : ''}>Валидация</TabsTrigger>
              <TabsTrigger value="code" className={isMobile ? 'text-xs py-2' : ''}>Код</TabsTrigger>
              <TabsTrigger value="export" className={isMobile ? 'text-xs py-2' : ''}>Экспорт</TabsTrigger>
            </TabsList>

            {/* Таб со статистикой */}
            <TabsContent value="stats" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-chart-bar text-blue-500"></i>
                    <span>Статистика бота</span>
                  </CardTitle>
                  <CardDescription>Обзор структуры и компонентов вашего бота</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-3 gap-4'}`}>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{botStats.totalNodes}</div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">Всего узлов</div>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{botStats.commandNodes}</div>
                      <div className="text-xs text-green-700 dark:text-green-300">Команд</div>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-center">
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{botStats.totalButtons}</div>
                      <div className="text-xs text-purple-700 dark:text-purple-300">Кнопок</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Таб с валидацией */}
            <TabsContent value="validation" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {validationResult.isValid ? (
                      <i className="fas fa-check-circle text-green-500"></i>
                    ) : (
                      <i className="fas fa-exclamation-triangle text-red-500"></i>
                    )}
                    <span>Проверка структуры</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {validationResult.isValid ? (
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800/40">
                      <i className="fas fa-check-circle"></i>
                      <span className="font-medium">Структура бота корректна и готова к экспорту!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800/40">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span className="font-medium">Найдены ошибки в структуре бота:</span>
                      </div>
                      <div className="space-y-2">
                        {(validationResult.errors || []).map((error, index) => (
                          <div key={index} className="flex items-start space-x-2 p-3 bg-red-50 dark:bg-red-950/20 rounded border-l-4 border-red-200 dark:border-red-800/60">
                            <i className="fas fa-times-circle text-red-500 dark:text-red-400 mt-0.5"></i>
                            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {botFatherCommands && (
                    <>
                      <Separator />
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/40">
                        <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Команды для @BotFather:</h5>
                        <pre className="bg-background p-3 rounded text-xs overflow-auto max-h-32">
                          {botFatherCommands}
                        </pre>
                        <Button onClick={() => copyToClipboard()} variant="outline" size="sm" className="mt-2">
                          <i className="fas fa-copy mr-2"></i>
                          Копировать команды
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Таб с кодом */}
            <TabsContent value="code" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className={getFormatIcon(selectedFormat)}></i>
                    <span>{getFormatLabel(selectedFormat)}</span>
                  </CardTitle>
                  <CardDescription>Выберите формат для просмотра</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Выбор формата */}
                  <Select value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as CodeFormat)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="python">Python код (.py)</SelectItem>
                      <SelectItem value="json">JSON данные (.json)</SelectItem>
                      <SelectItem value="requirements">Requirements.txt</SelectItem>
                      <SelectItem value="readme">README.md</SelectItem>
                      <SelectItem value="dockerfile">Dockerfile</SelectItem>
                      <SelectItem value="config">Config YAML (.yaml)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Кнопки действий */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={copyToClipboard}
                      variant="outline"
                      className="w-full"
                    >
                      <i className="fas fa-copy mr-2"></i>
                      Копировать
                    </Button>
                    <Button
                      onClick={downloadFile}
                      className="w-full"
                    >
                      <i className="fas fa-download mr-2"></i>
                      Скачать
                    </Button>
                  </div>

                  <Separator />

                  {/* Информация о коде */}
                  {codeStats.totalLines > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Строк: {codeStats.totalLines}</span>
                        {(selectedFormat === 'python' || selectedFormat === 'json') && (
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={toggleAllFunctions}
                            className="h-6 px-2 text-xs"
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
                        >
                          Показать всё ({codeStats.totalLines})
                        </Button>
                      )}
                    </div>
                  )}

                  <div className={`${isMobile ? 'h-48' : 'h-[500px]'} rounded border border-slate-300 dark:border-slate-700 overflow-hidden`}>
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
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Таб с быстрым экспортом */}
            <TabsContent value="export" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-download text-blue-500"></i>
                    <span>Быстрый экспорт</span>
                  </CardTitle>
                  <CardDescription>Скачайте готовые файлы проекта</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button 
                      size="lg" 
                      onClick={async () => { setSelectedFormat('python'); await downloadFile(); }} 
                      variant="outline" 
                      className="h-auto p-4 flex-col space-y-2"
                    >
                      <i className="fas fa-code text-2xl text-blue-500"></i>
                      <span className="font-medium">Python код</span>
                    </Button>
                    
                    <Button 
                      size="lg" 
                      onClick={async () => { setSelectedFormat('json'); await downloadFile(); }} 
                      variant="outline" 
                      className="h-auto p-4 flex-col space-y-2"
                    >
                      <i className="fas fa-database text-2xl text-green-500"></i>
                      <span className="font-medium">JSON данные</span>
                    </Button>

                    <Button 
                      size="lg" 
                      onClick={downloadAllFiles}
                      className="h-auto p-4 flex-col space-y-2 md:col-span-2"
                    >
                      <i className="fas fa-archive text-2xl"></i>
                      <span className="font-medium">Скачать все файлы</span>
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-semibold">Отдельные файлы:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      <Button size="sm" variant="ghost" onClick={async () => { setSelectedFormat('requirements'); await downloadFile(); }} className="h-auto p-3 flex-col space-y-1 border border-muted">
                        <i className="fas fa-list text-lg text-orange-500"></i>
                        <span className="text-xs font-medium">Зависимости</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => { setSelectedFormat('readme'); await downloadFile(); }} className="h-auto p-3 flex-col space-y-1 border border-muted">
                        <i className="fas fa-file-alt text-lg text-purple-500"></i>
                        <span className="text-xs font-medium">Документация</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => { setSelectedFormat('dockerfile'); await downloadFile(); }} className="h-auto p-3 flex-col space-y-1 border border-muted">
                        <i className="fab fa-docker text-lg text-cyan-500"></i>
                        <span className="text-xs font-medium">Dockerfile</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={async () => { setSelectedFormat('config'); await downloadFile(); }} className="h-auto p-3 flex-col space-y-1 border border-muted">
                        <i className="fas fa-cog text-lg text-yellow-500"></i>
                        <span className="text-xs font-medium">Конфиг</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
