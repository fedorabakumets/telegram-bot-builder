import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileCode, Database, FileText, Package, Settings, Download, Copy, Archive } from 'lucide-react';
import { useLocation } from 'wouter';
const loadBotGenerator = () => import('@/lib/bot-generator');
const loadCommands = () => import('@/lib/commands');
import { BotData, BotGroup } from '@shared/schema';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { AdaptiveLayout } from '@/components/layout/adaptive-layout';
import { AdaptiveHeader } from '@/components/layout/adaptive-header';
import { LayoutConfig, useLayoutManager } from '@/components/layout/layout-manager';

type ExportFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'config';

export default function ExportPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id || '';
  const [, setLocation] = useLocation();
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
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { config: layoutConfig } = useLayoutManager();
  const [currentTab, setCurrentTab] = useState<'editor' | 'preview' | 'export'>('export');

  // Загрузка данных проекта
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId
  });

  const botData: BotData = (project as any)?.data || { nodes: [], connections: [] };
  const projectName: string = (project as any)?.name || 'Бот';

  // Загрузка групп
  const { data: groups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups']
  });

  const getAllNodes = (data: BotData) => {
    if (!data) return [];
    
    if ((data as any).sheets && Array.isArray((data as any).sheets)) {
      let allNodes: any[] = [];
      (data as any).sheets.forEach((sheet: any) => {
        if (sheet.nodes && Array.isArray(sheet.nodes)) {
          allNodes = allNodes.concat(sheet.nodes);
        }
      });
      return allNodes;
    } else {
      return data.nodes || [];
    }
  };

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

  useEffect(() => {
    async function loadContent() {
      if (!generateExportContent[selectedFormat] || exportContent[selectedFormat]) return;
      
      try {
        const content = await generateExportContent[selectedFormat]();
        setExportContent(prev => ({ ...prev, [selectedFormat]: content }));
        
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

  const getCurrentContent = () => {
    return exportContent[selectedFormat] || '';
  };

  const [freshBotData, setFreshBotData] = useState<BotData | null>(null);
  
  useEffect(() => {
    async function loadFreshProjectData() {
      if (projectId) {
        try {
          const response = await fetch(`/api/projects/${projectId}`);
          if (response.ok) {
            const proj = await response.json();
            if (proj.data) {
              setFreshBotData(proj.data);
            }
          }
        } catch (error) {
          console.error('Error loading fresh project data:', error);
        }
      }
    }
    
    loadFreshProjectData();
  }, [projectId]);

  useEffect(() => {
    async function loadBotFatherCommands() {
      const dataToUse = freshBotData || botData;
      if (dataToUse) {
        try {
          const commands = await loadCommands();
          
          let nodes: any[] = [];
          if ((dataToUse as any).sheets && Array.isArray((dataToUse as any).sheets)) {
            (dataToUse as any).sheets.forEach((sheet: any) => {
              if (sheet.nodes && Array.isArray(sheet.nodes)) {
                nodes = nodes.concat(sheet.nodes);
              }
            });
          } else {
            nodes = dataToUse.nodes || [];
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
    }
    
    loadBotFatherCommands();
  }, [freshBotData, botData]);

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

  // Навигация между вкладками
  const handleTabChange = (tab: 'editor' | 'preview' | 'export' | 'bot' | 'users' | 'groups') => {
    if (tab === 'editor') {
      setLocation(`/editor/${projectId}`);
    } else if (tab === 'preview') {
      setLocation(`/preview/${projectId}`);
    } else if (tab === 'export') {
      setCurrentTab('export');
    }
  };

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="text-lg text-muted-foreground">Загрузка...</div>
        </div>
      </div>
    );
  }

  // Sidebar контент с быстрыми кнопками экспорта
  const sidebarContent = (
    <div className="h-full flex flex-col bg-background border-r border-border">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Download className="w-5 h-5" />
          Быстрый экспорт
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Скачайте файлы проекта</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-3"
            onClick={() => downloadFile('python')}
            data-testid="sidebar-download-python"
          >
            <FileCode className="w-4 h-4 mr-2 text-blue-500" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">Python код</span>
              <span className="text-xs text-muted-foreground">.py файл</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-3"
            onClick={() => downloadFile('json')}
            data-testid="sidebar-download-json"
          >
            <Database className="w-4 h-4 mr-2 text-green-500" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">JSON данные</span>
              <span className="text-xs text-muted-foreground">.json файл</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-3"
            onClick={() => downloadFile('requirements')}
            data-testid="sidebar-download-requirements"
          >
            <FileText className="w-4 h-4 mr-2 text-orange-500" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">Requirements</span>
              <span className="text-xs text-muted-foreground">.txt файл</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-3"
            onClick={() => downloadFile('readme')}
            data-testid="sidebar-download-readme"
          >
            <FileText className="w-4 h-4 mr-2 text-purple-500" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">README</span>
              <span className="text-xs text-muted-foreground">.md файл</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-3"
            onClick={() => downloadFile('dockerfile')}
            data-testid="sidebar-download-dockerfile"
          >
            <Package className="w-4 h-4 mr-2 text-cyan-500" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">Dockerfile</span>
              <span className="text-xs text-muted-foreground">Docker</span>
            </div>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 px-3"
            onClick={() => downloadFile('config')}
            data-testid="sidebar-download-config"
          >
            <Settings className="w-4 h-4 mr-2 text-pink-500" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">Config.yaml</span>
              <span className="text-xs text-muted-foreground">.yaml файл</span>
            </div>
          </Button>

          <Separator className="my-2" />

          <Button
            className="w-full justify-start h-auto py-3 px-3"
            onClick={downloadAllFiles}
            data-testid="sidebar-download-all"
          >
            <Archive className="w-4 h-4 mr-2" />
            <div className="flex flex-col items-start">
              <span className="font-medium text-sm">Скачать все</span>
              <span className="text-xs opacity-80">Все файлы проекта</span>
            </div>
          </Button>
        </div>
      </ScrollArea>
    </div>
  );

  // Properties контент со статистикой бота
  const propertiesContent = (
    <div className="h-full flex flex-col bg-background border-l border-border">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-lg">Статистика бота</h2>
        <p className="text-xs text-muted-foreground mt-1">Обзор компонентов</p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="stat-total-nodes">
              {botStats.totalNodes}
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">Всего узлов</div>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="stat-commands">
              {botStats.commandNodes}
            </div>
            <div className="text-sm text-green-700 dark:text-green-300">Команды</div>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="stat-messages">
              {botStats.messageNodes}
            </div>
            <div className="text-sm text-purple-700 dark:text-purple-300">Сообщения</div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400" data-testid="stat-photos">
              {botStats.photoNodes}
            </div>
            <div className="text-sm text-amber-700 dark:text-amber-300">Фото</div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400" data-testid="stat-keyboards">
              {botStats.keyboardNodes}
            </div>
            <div className="text-sm text-indigo-700 dark:text-indigo-300">Клавиатуры</div>
          </div>

          <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-3">
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400" data-testid="stat-buttons">
              {botStats.totalButtons}
            </div>
            <div className="text-sm text-pink-700 dark:text-pink-300">Кнопки</div>
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>В меню:</span>
              <Badge variant="secondary" data-testid="stat-menu-commands">{botStats.commandsInMenu}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Только админ:</span>
              <Badge variant="outline" data-testid="stat-admin-commands">{botStats.adminOnlyCommands}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Приватные:</span>
              <Badge variant="outline" data-testid="stat-private-commands">{botStats.privateOnlyCommands}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span>Соединения:</span>
              <Badge variant="outline" data-testid="stat-connections">{botData?.connections?.length || 0}</Badge>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );

  // Canvas контент с вкладками
  const canvasContent = (
    <div className="h-full flex flex-col bg-background">
      <Tabs defaultValue="stats" className="flex-1 flex flex-col">
        {isMobile ? (
          <div className="p-2 space-y-2 border-b border-border">
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
          <TabsList className="m-4 grid grid-cols-5">
            <TabsTrigger value="stats" data-testid="tab-stats">Статистика</TabsTrigger>
            <TabsTrigger value="validation" data-testid="tab-validation">Валидация</TabsTrigger>
            <TabsTrigger value="files" data-testid="tab-files">Файлы</TabsTrigger>
            <TabsTrigger value="export" data-testid="tab-export">Экспорт</TabsTrigger>
            <TabsTrigger value="setup" data-testid="tab-setup">Настройка</TabsTrigger>
          </TabsList>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            <TabsContent value="stats" className="mt-0">
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
                  
                  <Separator className="my-4" />
                  
                  <div className={`space-y-${isMobile ? '4' : '3'}`}>
                    <h4 className={`${isMobile ? 'font-semibold text-lg' : 'font-medium'}`}>Детальная статистика:</h4>
                    <div className={`space-y-${isMobile ? '3' : '2'} ${isMobile ? 'text-base' : 'text-sm'}`}>
                      <div className={`flex justify-between items-center ${isMobile ? 'py-2' : ''}`}>
                        <span className={`${isMobile ? 'font-medium' : ''}`}>Текстовые сообщения:</span>
                        <Badge variant="secondary" className={`${isMobile ? 'text-base px-3 py-1' : ''}`}>{botStats.messageNodes}</Badge>
                      </div>
                      <div className={`flex justify-between items-center ${isMobile ? 'py-2' : ''}`}>
                        <span className={`${isMobile ? 'font-medium' : ''}`}>Фото сообщения:</span>
                        <Badge variant="secondary" className={`${isMobile ? 'text-base px-3 py-1' : ''}`}>{botStats.photoNodes}</Badge>
                      </div>
                      <div className={`flex justify-between items-center ${isMobile ? 'py-2' : ''}`}>
                        <span className={`${isMobile ? 'font-medium' : ''}`}>Приватные команды:</span>
                        <Badge variant="outline" className={`${isMobile ? 'text-base px-3 py-1' : ''}`}>{botStats.privateOnlyCommands}</Badge>
                      </div>
                      <div className={`flex justify-between items-center ${isMobile ? 'py-2' : ''}`}>
                        <span className={`${isMobile ? 'font-medium' : ''}`}>Соединения между узлами:</span>
                        <Badge variant="outline" className={`${isMobile ? 'text-base px-3 py-1' : ''}`}>{botData?.connections?.length || 0}</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="validation" className="mt-0">
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

            <TabsContent value="files" className="mt-0">
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
                    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard()} className={`${isMobile ? 'w-full' : ''}`} data-testid="button-copy-content">
                        <Copy className="w-4 h-4 mr-2" />
                        Копировать
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadFile()} className={`${isMobile ? 'w-full' : ''}`} data-testid="button-download-file">
                        <Download className="w-4 h-4 mr-2" />
                        Скачать
                      </Button>
                      <Button size="sm" onClick={downloadAllFiles} className={`${isMobile ? 'w-full' : ''}`} data-testid="button-download-all-files">
                        <Archive className="w-4 h-4 mr-2" />
                        Скачать все
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {validationResult.isValid ? (
                    <Textarea
                      value={getCurrentContent()}
                      readOnly
                      className={`${isMobile ? 'min-h-[200px]' : 'min-h-[350px]'} font-mono ${isMobile ? 'text-xs' : 'text-sm'} bg-muted/50 dark:bg-muted/20 border-muted dark:border-muted/40 resize-none`}
                      placeholder="Выберите формат для просмотра..."
                      data-testid="textarea-export-content"
                    />
                  ) : (
                    <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg text-center text-muted-foreground border border-muted dark:border-muted/40">
                      <i className="fas fa-exclamation-triangle mb-2 text-yellow-500 dark:text-yellow-400"></i>
                      <p>Исправьте ошибки валидации для экспорта файлов</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="setup" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-cog text-blue-500"></i>
                    <span>Настройка и запуск бота</span>
                  </CardTitle>
                  <CardDescription>Инструкции по установке и настройке вашего бота</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Команды для @BotFather:</h4>
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Команды меню бота</span>
                        <Button 
                          onClick={() => copyToClipboard(botFatherCommands)}
                          variant="ghost" 
                          size="sm"
                          data-testid="button-copy-botfather-commands"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          <span className="text-xs">Копировать</span>
                        </Button>
                      </div>
                      <Textarea
                        value={botFatherCommands}
                        readOnly
                        className="min-h-[150px] font-mono text-sm bg-muted/50 dark:bg-muted/20 border-muted dark:border-muted/40"
                        placeholder="Команды будут сгенерированы автоматически..."
                      />
                      <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
                        1. Отправьте /setcommands в @BotFather<br />
                        2. Выберите своего бота<br />
                        3. Скопируйте и вставьте команды выше
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Быстрый старт:</h4>
                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/40">
                      <ol className="list-decimal list-inside space-y-2 text-sm text-blue-700 dark:text-blue-300">
                        <li>Установите Python 3.8 или выше</li>
                        <li>Скачайте файлы бота (Python код и requirements.txt)</li>
                        <li>Установите зависимости: <code className="bg-muted/60 px-1 rounded">pip install -r requirements.txt</code></li>
                        <li>Создайте файл .env и добавьте токен бота: <code className="bg-muted/60 px-1 rounded">BOT_TOKEN=your_token_here</code></li>
                        <li>Запустите бота: <code className="bg-muted/60 px-1 rounded">python bot.py</code></li>
                      </ol>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h4 className="font-medium">Дополнительные настройки @BotFather:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                        <code className="text-sm font-mono">/setdescription</code>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('/setdescription')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                        <code className="text-sm font-mono">/setuserpic</code>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('/setuserpic')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                        <code className="text-sm font-mono">/setname</code>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('/setname')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                        <code className="text-sm font-mono">/setabouttext</code>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('/setabouttext')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="export" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Download className="w-5 h-5 text-blue-500" />
                    <span>Быстрый экспорт</span>
                  </CardTitle>
                  <CardDescription>Загрузите файлы бота одним кликом</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 py-5">
                  <div className="grid grid-cols-1 gap-4">
                    <Button 
                      size="lg" 
                      onClick={async () => { 
                        setSelectedFormat('python'); 
                        await downloadFile('python'); 
                      }} 
                      variant="outline" 
                      className="h-16 flex-col space-y-1" 
                      data-testid="button-download-python"
                    >
                      <FileCode className="w-6 h-6 text-blue-500" />
                      <span className="font-medium">Скачать Python код</span>
                    </Button>
                    
                    <Button 
                      size="lg" 
                      onClick={async () => { 
                        setSelectedFormat('json'); 
                        await downloadFile('json'); 
                      }} 
                      variant="outline" 
                      className="h-16 flex-col space-y-1" 
                      data-testid="button-download-json"
                    >
                      <Database className="w-6 h-6 text-green-500" />
                      <span className="font-medium">Скачать JSON данные</span>
                    </Button>
                    
                    <Button 
                      size="lg" 
                      onClick={downloadAllFiles} 
                      className="h-16 flex-col space-y-1" 
                      data-testid="button-download-all"
                    >
                      <Archive className="w-6 h-6" />
                      <span className="font-medium">Скачать все файлы</span>
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-base">Остальные файлы проекта:</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => downloadFile('requirements')} 
                        className="h-auto p-3 flex-col space-y-1 border border-muted" 
                        data-testid="button-download-requirements"
                      >
                        <FileText className="w-5 h-5 text-orange-500" />
                        <span className="font-medium">Зависимости</span>
                        <span className="text-xs text-muted-foreground">.txt</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => downloadFile('readme')} 
                        className="h-auto p-3 flex-col space-y-1 border border-muted" 
                        data-testid="button-download-readme"
                      >
                        <FileText className="w-5 h-5 text-purple-500" />
                        <span className="font-medium">Документация</span>
                        <span className="text-xs text-muted-foreground">.md</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => downloadFile('dockerfile')} 
                        className="h-auto p-3 flex-col space-y-1 border border-muted" 
                        data-testid="button-download-dockerfile"
                      >
                        <Package className="w-5 h-5 text-cyan-500" />
                        <span className="font-medium">Docker</span>
                        <span className="text-xs text-muted-foreground">file</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => downloadFile('config')} 
                        className="h-auto p-3 flex-col space-y-1 border border-muted" 
                        data-testid="button-download-config"
                      >
                        <Settings className="w-5 h-5 text-pink-500" />
                        <span className="font-medium">Конфигурация</span>
                        <span className="text-xs text-muted-foreground">.yaml</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  );

  // Header контент
  const headerContent = (
    <AdaptiveHeader
      config={layoutConfig}
      projectName={projectName}
      currentTab={currentTab}
      onTabChange={handleTabChange}
    />
  );

  return (
    <AdaptiveLayout
      config={layoutConfig}
      header={headerContent}
      sidebar={sidebarContent}
      canvas={canvasContent}
      properties={propertiesContent}
    />
  );
}
