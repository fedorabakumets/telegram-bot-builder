import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { BotData, BotGroup } from '@shared/schema';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from '@monaco-editor/react';

// Динамический импорт тяжелых генераторов для улучшения производительности
const loadBotGenerator = () => import('@/lib/bot-generator');
const loadCommands = () => import('@/lib/commands');

interface ExportPanelProps {
  botData: BotData;
  projectName: string;
  projectId: number;
}

type ExportFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'config';

export function ExportPanel({ botData, projectName, projectId }: ExportPanelProps) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('python');
  const [exportContent, setExportContent] = useState<Record<ExportFormat, string>>({
    python: '',
    json: '',
    requirements: '',
    readme: '',
    dockerfile: '',
    config: ''
  });
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });
  const [botFatherCommands, setBotFatherCommands] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [showFullCode, setShowFullCode] = useState(false);
  const [areAllCollapsed, setAreAllCollapsed] = useState(true);
  const editorRef = useRef<any>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

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

  // Автоматическое сворачивание функций при загрузке
  useEffect(() => {
    if (editorRef.current && selectedFormat === 'python') {
      setTimeout(() => {
        editorRef.current?.getAction('editor.foldAll')?.run();
        setAreAllCollapsed(true);
      }, 100);
    }
  }, [displayContent, selectedFormat]);

  // Загрузка групп
  const { data: groups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups'],
  });

  // Функция для сбора всех узлов из всех листов проекта
  const getAllNodes = (data: BotData) => {
    if (!data) return [];
    
    if ((data as any).sheets && Array.isArray((data as any).sheets)) {
      // Многолистовой проект - собираем узлы из всех листов
      let allNodes: any[] = [];
      (data as any).sheets.forEach((sheet: any) => {
        if (sheet.nodes && Array.isArray(sheet.nodes)) {
          allNodes = allNodes.concat(sheet.nodes);
        }
      });
      return allNodes;
    } else {
      // Обычный проект
      return data.nodes || [];
    }
  };

  // Статистика бота с учетом всех листов проекта
  const allNodes = getAllNodes(botData);
  const botStats = {
    totalNodes: allNodes.length,
    commandNodes: allNodes.filter(node => node.type === 'start' || node.type === 'command').length,
    messageNodes: allNodes.filter(node => node.type === 'message').length,
    photoNodes: allNodes.filter(node => node.type === 'photo').length,
    keyboardNodes: allNodes.filter(node => node.data?.keyboardType !== 'none').length,
    totalButtons: allNodes.reduce((sum, node) => sum + (node.data?.buttons?.length || 0), 0),
    commandsInMenu: allNodes.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data?.showInMenu
    ).length,
    adminOnlyCommands: allNodes.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data?.adminOnly
    ).length,
    privateOnlyCommands: allNodes.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data?.isPrivateOnly
    ).length
  };

  // Асинхронная ленивая генерация экспорта - только когда нужен конкретный формат
  const generateExportContent = useMemo(() => {
    if (!botData) return {};
    
    return {
      python: async () => {
        const botGenerator = await loadBotGenerator();
        const validation = botGenerator.validateBotStructure(botData);
        setValidationResult(validation || { isValid: false, errors: [] });
        
        if (!validation?.isValid) return '';
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
      },
      config: async () => {
        const botGenerator = await loadBotGenerator();
        return botGenerator.generateConfigYaml(projectName);
      }
    };
  }, [botData, projectName, groups]);

  // Асинхронное получение контента для выбранного формата
  useEffect(() => {
    async function loadContent() {
      if (!generateExportContent[selectedFormat] || exportContent[selectedFormat]) return;
      
      try {
        const content = await generateExportContent[selectedFormat]();
        setExportContent(prev => ({ ...prev, [selectedFormat]: content }));
        
        // Для Python также устанавливаем основной код
        if (selectedFormat === 'python') {
          setGeneratedCode(content);
        }
      } catch (error) {
        console.error('Error loading export content:', error);
        toast({
          title: "Ошибка генерации",
          description: "Не удалось сгенерировать контент для экспорта",
          variant: "destructive",
        });
      }
    }
    
    loadContent();
  }, [generateExportContent, selectedFormat, exportContent, toast]);

  // Получение текущего контента
  const getCurrentContent = () => {
    return exportContent[selectedFormat] || '';
  };

  // Оптимизированное отображение контента с ограничением линий для больших объемов кода
  const displayContent = useMemo(() => {
    const content = getCurrentContent();
    const lines = content.split('\n');
    const MAX_VISIBLE_LINES = 1000;
    
    if (!showFullCode && lines.length > MAX_VISIBLE_LINES) {
      return lines.slice(0, MAX_VISIBLE_LINES).join('\n');
    }
    return content;
  }, [getCurrentContent(), showFullCode]);

  // Информация о размере кода
  const codeStats = useMemo(() => {
    const content = getCurrentContent();
    const lines = content.split('\n');
    return {
      totalLines: lines.length,
      truncated: !showFullCode && lines.length > 1000
    };
  }, [getCurrentContent(), showFullCode]);

  // Получение свежих данных проекта с нормализацией
  const [freshBotData, setFreshBotData] = useState<BotData | null>(null);
  
  useEffect(() => {
    async function loadFreshProjectData() {
      if (!projectId) {
        console.log('ExportPanel: using botData from props (no projectId yet)');
        setFreshBotData(botData); // Используем данные из пропсов
        return;
      }
      
      try {
        console.log('🔄 ExportPanel: Загружаем свежие данные проекта из API...');
        const response = await fetch(`/api/projects/${projectId}`);
        if (response.ok) {
          const project = await response.json();
          console.log('📡 ExportPanel: Данные проекта получены:', project);
          // Устанавливаем свежие данные с нормализацией
          if (project.data) {
            console.log('✅ ExportPanel: Устанавливаем свежие данные:', project.data);
            setFreshBotData(project.data);
          }
        } else {
          console.error('❌ ExportPanel: Ошибка загрузки данных проекта:', response.status);
        }
      } catch (error) {
        console.error('Error loading fresh project data:', error);
      }
    }
    
    loadFreshProjectData();
  }, [projectId, botData]);

  // Генерация команд BotFather с использованием свежих данных
  useEffect(() => {
    async function loadBotFatherCommands() {
      const dataToUse = freshBotData || botData;
      if (dataToUse) {
        try {
          const commands = await loadCommands();
          console.log('🔍 ExportPanel: Полные данные для генерации команд:', dataToUse);
          
          // Собираем узлы из всех листов проекта
          let nodes: any[] = [];
          if ((dataToUse as any).sheets && Array.isArray((dataToUse as any).sheets)) {
            // Многолистовой проект - собираем узлы из всех листов
            console.log('📊 ExportPanel: Найдено листов:', (dataToUse as any).sheets.length);
            (dataToUse as any).sheets.forEach((sheet: any, index: number) => {
              console.log(`📋 ExportPanel: Лист ${index + 1} (${sheet.name || sheet.id}):`, sheet.nodes?.length || 0, 'узлов');
              if (sheet.nodes && Array.isArray(sheet.nodes)) {
                nodes = nodes.concat(sheet.nodes);
              }
            });
          } else {
            console.log('📋 ExportPanel: Обычный проект, узлов:', dataToUse.nodes?.length || 0);
            // Обычный проект
            nodes = dataToUse.nodes || [];
          }
          
          console.log('🎯 ExportPanel: ИТОГО узлов из всех листов:', nodes.length);

          const commandNodes = nodes.filter((node: any) => 
            (node.type === 'start' || node.type === 'command') && 
            node.data?.command &&
            (node.data?.showInMenu !== false)
          );
          console.log('🎯 ExportPanel: Команды для меню BotFather:', commandNodes.length, 'команд');
          
          const botFatherCmds = commands.generateBotFatherCommands(commandNodes);
          setBotFatherCommands(botFatherCmds);
        } catch (error) {
          console.error('Error loading BotFather commands:', error);
        }
      }
    }
    
    loadBotFatherCommands();
  }, [freshBotData, botData]);

  const getFileExtension = (format: ExportFormat): string => {
    const extensions = {
      python: 'py',
      json: 'json',
      requirements: 'txt',
      readme: 'md',
      dockerfile: '',
      config: 'yaml'
    };
    return extensions[format];
  };

  const getFileName = (format: ExportFormat): string => {
    const baseFileName = projectName.replace(/\s+/g, '_');
    const names = {
      python: `${baseFileName}_bot.py`,
      json: `${baseFileName}_data.json`,
      requirements: 'requirements.txt',
      readme: 'README.md',
      dockerfile: 'Dockerfile',
      config: 'config.yaml'
    };
    return names[format];
  };

  const copyToClipboard = async (content?: string) => {
    const textToCopy = content || getCurrentContent();
    try {
      await navigator.clipboard.writeText(textToCopy);
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

  const downloadFile = async (format?: ExportFormat) => {
    const formatToDownload = format || selectedFormat;
    const content = formatToDownload === selectedFormat ? getCurrentContent() : 
      (generateExportContent[formatToDownload] ? await generateExportContent[formatToDownload]() : '');
    const fileName = getFileName(formatToDownload);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Файл загружен!",
      description: `Файл ${fileName} сохранен`,
    });
  };

  const downloadAllFiles = () => {
    const formats: ExportFormat[] = ['python', 'json', 'requirements', 'readme', 'dockerfile', 'config'];
    formats.forEach(format => {
      setTimeout(() => downloadFile(format), formats.indexOf(format) * 100);
    });
    
    toast({
      title: "Все файлы загружены!",
      description: "Полный проект бота загружен",
    });
  };

  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# ')) {
        return <h1 key={i} className="text-2xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
      } else if (line.startsWith('## ')) {
        return <h2 key={i} className="text-xl font-bold mt-3 mb-2">{line.slice(3)}</h2>;
      } else if (line.startsWith('### ')) {
        return <h3 key={i} className="text-lg font-semibold mt-2 mb-1">{line.slice(4)}</h3>;
      } else if (line.startsWith('- ')) {
        return <li key={i} className="ml-4">{line.slice(2)}</li>;
      } else if (line.trim() === '') {
        return <br key={i} />;
      } else {
        return <p key={i} className="my-1">{line}</p>;
      }
    });
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold flex items-center space-x-3">
              <i className="fas fa-download text-primary"></i>
              <span>Экспорт кода бота</span>
            </h1>
            <p className="text-muted-foreground mt-1">Загрузите готовый код бота и документацию для развертывания</p>
          </div>

          <Tabs defaultValue="stats" className="mt-4">
            {isMobile ? (
              <div className="flex-shrink-0 space-y-2">
                <TabsList className="grid w-full grid-cols-3 h-auto gap-1">
                  <TabsTrigger value="stats" className="text-xs py-2 px-1" data-testid="tab-stats">Статистика</TabsTrigger>
                  <TabsTrigger value="validation" className="text-xs py-2 px-1" data-testid="tab-validation">Валидация</TabsTrigger>
                  <TabsTrigger value="files" className="text-xs py-2 px-1" data-testid="tab-files">Файлы</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 h-auto gap-1">
                  <TabsTrigger value="setup" className="text-xs py-2 px-1" data-testid="tab-setup">Настройка</TabsTrigger>
                  <TabsTrigger value="export" className="text-xs py-2 px-1" data-testid="tab-export">Экспорт</TabsTrigger>
                </TabsList>
              </div>
            ) : (
              <TabsList className="grid w-full grid-cols-5 flex-shrink-0">
                <TabsTrigger value="stats" data-testid="tab-stats">Статистика</TabsTrigger>
                <TabsTrigger value="validation" data-testid="tab-validation">Валидация</TabsTrigger>
                <TabsTrigger value="files" data-testid="tab-files">Файлы</TabsTrigger>
                <TabsTrigger value="export" data-testid="tab-export">Экспорт</TabsTrigger>
                <TabsTrigger value="setup" data-testid="tab-setup">Настройка</TabsTrigger>
              </TabsList>
            )}

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
                  <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
                    <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${isMobile ? 'p-4 flex items-center space-x-3' : 'p-3'}`}>
                      <div className={`${isMobile ? 'text-2xl' : 'text-2xl'} font-bold text-blue-600 dark:text-blue-400`}>{botStats.totalNodes}</div>
                      <div className={`${isMobile ? 'text-base font-medium' : 'text-sm'} text-blue-700 dark:text-blue-300`}>Всего узлов</div>
                    </div>
                    <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg ${isMobile ? 'p-4 flex items-center space-x-3' : 'p-3'}`}>
                      <div className={`${isMobile ? 'text-2xl' : 'text-2xl'} font-bold text-green-600 dark:text-green-400`}>{botStats.commandNodes}</div>
                      <div className={`${isMobile ? 'text-base font-medium' : 'text-sm'} text-green-700 dark:text-green-300`}>Команд</div>
                    </div>
                    <div className={`bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg ${isMobile ? 'p-4 flex items-center space-x-3' : 'p-3'}`}>
                      <div className={`${isMobile ? 'text-2xl' : 'text-2xl'} font-bold text-purple-600 dark:text-purple-400`}>{botStats.totalButtons}</div>
                      <div className={`${isMobile ? 'text-base font-medium' : 'text-sm'} text-purple-700 dark:text-purple-300`}>Кнопок</div>
                    </div>
                    <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${isMobile ? 'p-4 flex items-center space-x-3' : 'p-3'}`}>
                      <div className={`${isMobile ? 'text-2xl' : 'text-2xl'} font-bold text-amber-600 dark:text-amber-400`}>{botStats.keyboardNodes}</div>
                      <div className={`${isMobile ? 'text-base font-medium' : 'text-sm'} text-amber-700 dark:text-amber-300`}>С клавиатурой</div>
                    </div>
                    <div className={`bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg ${isMobile ? 'p-4 flex items-center space-x-3' : 'p-3'}`}>
                      <div className={`${isMobile ? 'text-2xl' : 'text-2xl'} font-bold text-indigo-600 dark:text-indigo-400`}>{botStats.commandsInMenu}</div>
                      <div className={`${isMobile ? 'text-base font-medium' : 'text-sm'} text-indigo-700 dark:text-indigo-300`}>В меню</div>
                    </div>
                    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${isMobile ? 'p-4 flex items-center space-x-3' : 'p-3'}`}>
                      <div className={`${isMobile ? 'text-2xl' : 'text-2xl'} font-bold text-red-600 dark:text-red-400`}>{botStats.adminOnlyCommands}</div>
                      <div className={`${isMobile ? 'text-base font-medium' : 'text-sm'} text-red-700 dark:text-red-300`}>Только админ</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validation" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {validationResult.isValid ? (
                      <i className="fas fa-check-circle text-green-500"></i>
                    ) : (
                      <i className="fas fa-exclamation-triangle text-red-500"></i>
                    )}
                    <span>Проверка структуры бота</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {validationResult.isValid ? (
                    <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800/40">
                      <i className="fas fa-check-circle"></i>
                      <span className="font-medium">Структура бота корректна и готова к экспорту!</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="files" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-file-archive text-blue-500"></i>
                    <span>Экспорт файлов проекта</span>
                  </CardTitle>
                  <CardDescription>Выберите формат для экспорта или загрузите все файлы</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`${isMobile ? 'flex flex-col space-y-4' : 'flex items-center justify-between'}`}>
                    <div className={`${isMobile ? 'w-full' : 'flex items-center space-x-4'}`}>
                      <Select value={selectedFormat} onValueChange={(value: ExportFormat) => setSelectedFormat(value)}>
                        <SelectTrigger className={`${isMobile ? 'w-full h-12 text-base' : 'w-[200px]'}`} data-testid="select-format-files">
                          <SelectValue placeholder="Выберите формат" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="python">Python код (.py)</SelectItem>
                          <SelectItem value="json">JSON данные (.json)</SelectItem>
                          <SelectItem value="requirements">Зависимости (.txt)</SelectItem>
                          <SelectItem value="readme">Документация (.md)</SelectItem>
                          <SelectItem value="dockerfile">Dockerfile</SelectItem>
                          <SelectItem value="config">Конфигурация (.yaml)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className={`flex ${isMobile ? 'w-full' : ''} space-x-2`}>
                      <Button onClick={() => copyToClipboard()} variant="outline" className={isMobile ? 'flex-1' : ''} data-testid="button-copy-files">
                        <i className="fas fa-copy mr-2"></i>
                        Копировать
                      </Button>
                      <Button onClick={() => downloadFile()} className={isMobile ? 'flex-1' : ''} data-testid="button-download-files">
                        <i className="fas fa-download mr-2"></i>
                        Скачать
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {codeStats.totalLines > 0 && (
                      <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
                        <div className="flex items-center gap-2">
                          <span>Строк: {codeStats.totalLines}</span>
                          {selectedFormat === 'python' && (
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
                        {codeStats.truncated && (
                          <div className="flex items-center gap-2">
                            <span className="text-yellow-600 dark:text-yellow-500">⚠️ Показано первые 1000 строк</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setShowFullCode(true)}
                              data-testid="button-show-full-code"
                            >
                              Показать всё ({codeStats.totalLines})
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    <div className={`${isMobile ? 'h-48' : 'h-[400px]'} rounded border border-slate-300 dark:border-slate-700 overflow-hidden`}>
                      {selectedFormat === 'python' ? (
                        <Editor
                          value={displayContent}
                          language="python"
                          theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
                          onMount={(editor) => {
                            editorRef.current = editor;
                            setTimeout(() => {
                              editor.getAction('editor.foldAll')?.run();
                              setAreAllCollapsed(true);
                            }, 100);
                          }}
                          options={{
                            readOnly: true,
                            lineNumbers: 'on',
                            wordWrap: 'on',
                            fontSize: 12,
                            lineHeight: 1.5,
                            minimap: { enabled: false },
                            folding: true,
                            foldingHighlight: true,
                            foldingStrategy: 'auto',
                            showFoldingControls: 'always',
                            glyphMargin: true,
                            scrollBeyondLastLine: false,
                            padding: { top: 8, bottom: 8 },
                            automaticLayout: true,
                            contextmenu: false
                          }}
                          data-testid="monaco-editor-export-python"
                        />
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
                          placeholder="Выберите формат для просмотра содержимого..."
                          data-testid="textarea-export-preview"
                        />
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Загрузить все файлы проекта:</span>
                    <Button onClick={downloadAllFiles} variant="default" data-testid="button-download-all-files">
                      <i className="fas fa-archive mr-2"></i>
                      Скачать все
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Остальные табы будут добавлены в следующей части */}
            <TabsContent value="export" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-download text-blue-500"></i>
                    <span>Быстрый экспорт</span>
                  </CardTitle>
                  <CardDescription>Быстрые действия для экспорта файлов</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button size="lg" onClick={async () => { setSelectedFormat('python'); await downloadFile('python'); }} variant="outline" className="h-20 flex-col space-y-1" data-testid="button-download-python">
                      <i className="fas fa-code text-2xl text-blue-500"></i>
                      <span className="font-medium">Скачать Python код</span>
                    </Button>
                    
                    <Button size="lg" onClick={async () => { setSelectedFormat('json'); await downloadFile('json'); }} variant="outline" className="h-20 flex-col space-y-1" data-testid="button-download-json">
                      <i className="fas fa-database text-2xl text-green-500"></i>
                      <span className="font-medium">Скачать JSON данные</span>
                    </Button>
                    
                    <Button size="lg" onClick={downloadAllFiles} className="h-20 flex-col space-y-1 md:col-span-2" data-testid="button-download-all">
                      <i className="fas fa-archive text-2xl"></i>
                      <span className="font-medium">Скачать все файлы</span>
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Отдельные файлы:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <Button size="sm" variant="ghost" onClick={() => downloadFile('requirements')} className="h-auto p-4 flex-col space-y-2 border border-muted" data-testid="button-download-requirements">
                        <i className="fas fa-list text-xl text-orange-500"></i>
                        <span className="font-medium text-sm">Зависимости</span>
                        <span className="text-xs text-muted-foreground">.txt</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadFile('readme')} className="h-auto p-4 flex-col space-y-2 border border-muted" data-testid="button-download-readme">
                        <i className="fas fa-file-alt text-xl text-purple-500"></i>
                        <span className="font-medium text-sm">Документация</span>
                        <span className="text-xs text-muted-foreground">.md</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => downloadFile('dockerfile')} className="h-auto p-4 flex-col space-y-2 border border-muted" data-testid="button-download-dockerfile">
                        <i className="fab fa-docker text-xl text-cyan-500"></i>
                        <span className="font-medium text-sm">Dockerfile</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="setup" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Настройка и развертывание</CardTitle>
                  <CardDescription>Пошаговая инструкция по установке и запуску бота</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {botFatherCommands && (
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/40">
                      <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Команды для @BotFather:</h5>
                      <div className="space-y-2">
                        <Textarea 
                          value={botFatherCommands} 
                          readOnly 
                          className="font-mono text-sm h-32 bg-background"
                          data-testid="textarea-botfather-commands"
                        />
                        <Button onClick={() => copyToClipboard(botFatherCommands)} variant="outline" size="sm" data-testid="button-copy-botfather">
                          <i className="fas fa-copy mr-2"></i>
                          Копировать команды
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h4 className="font-medium">Инструкция по запуску:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>Скачайте все файлы проекта</li>
                      <li>Установите Python 3.9 или выше</li>
                      <li>Установите зависимости: <code className="bg-muted px-2 py-1 rounded">pip install -r requirements.txt</code></li>
                      <li>Замените BOT_TOKEN на ваш токен от @BotFather</li>
                      <li>Запустите бота: <code className="bg-muted px-2 py-1 rounded">python имя_файла.py</code></li>
                    </ol>
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
