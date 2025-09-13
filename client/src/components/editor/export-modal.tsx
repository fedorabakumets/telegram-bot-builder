import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
// Динамический импорт тяжелых генераторов для улучшения производительности
const loadBotGenerator = () => import('@/lib/bot-generator');
const loadCommands = () => import('@/lib/commands');
import { BotData, BotGroup } from '@shared/schema';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  botData: BotData;
  projectName: string;
}

type ExportFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'config';

export function ExportModal({ isOpen, onClose, botData, projectName }: ExportModalProps) {
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

  // Загрузка групп
  const { data: groups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups'],
    enabled: isOpen
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
    if (!isOpen || !botData) return {};
    
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
  }, [isOpen, botData, projectName, groups]);

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

  // Получение свежих данных проекта с нормализацией при открытии
  const [freshBotData, setFreshBotData] = useState<BotData | null>(null);
  
  useEffect(() => {
    async function loadFreshProjectData() {
      if (isOpen) {
        try {
          // Получаем ID проекта из URL
          const projectId = window.location.pathname.split('/').pop();
          if (projectId && !isNaN(Number(projectId))) {
            console.log('🔄 ExportModal: Загружаем свежие данные проекта из API...');
            const response = await fetch(`/api/projects/${projectId}`);
            if (response.ok) {
              const project = await response.json();
              console.log('📡 ExportModal: Данные проекта получены:', project);
              // Устанавливаем свежие данные с нормализацией
              if (project.data) {
                console.log('✅ ExportModal: Устанавливаем свежие данные:', project.data);
                setFreshBotData(project.data);
              }
            } else {
              console.error('❌ ExportModal: Ошибка загрузки данных проекта:', response.status);
            }
          }
        } catch (error) {
          console.error('Error loading fresh project data:', error);
        }
      }
    }
    
    loadFreshProjectData();
  }, [isOpen]);

  // Генерация команд BotFather с использованием свежих данных
  useEffect(() => {
    async function loadBotFatherCommands() {
      const dataToUse = freshBotData || botData;
      if (isOpen && dataToUse) {
        try {
          const commands = await loadCommands();
          console.log('🔍 ExportModal: Полные данные для генерации команд:', dataToUse);
          
          // Собираем узлы из всех листов проекта
          let nodes: any[] = [];
          if ((dataToUse as any).sheets && Array.isArray((dataToUse as any).sheets)) {
            // Многолистовой проект - собираем узлы из всех листов
            console.log('📊 ExportModal: Найдено листов:', (dataToUse as any).sheets.length);
            (dataToUse as any).sheets.forEach((sheet: any, index: number) => {
              console.log(`📋 ExportModal: Лист ${index + 1} (${sheet.name || sheet.id}):`, sheet.nodes?.length || 0, 'узлов');
              if (sheet.nodes && Array.isArray(sheet.nodes)) {
                nodes = nodes.concat(sheet.nodes);
              }
            });
          } else {
            console.log('📋 ExportModal: Обычный проект, узлов:', dataToUse.nodes?.length || 0);
            // Обычный проект
            nodes = dataToUse.nodes || [];
          }
          
          console.log('🎯 ExportModal: ИТОГО узлов из всех листов:', nodes.length);
          
          // Детальная диагностика всех узлов команд
          const allCommandAndStartNodes = nodes.filter((node: any) => 
            node.type === 'start' || node.type === 'command'
          );
          console.log('📊 ExportModal: ВСЕ узлы start/command (до фильтрации):', allCommandAndStartNodes.length);
          allCommandAndStartNodes.forEach((node: any, index: number) => {
            console.log(`  ${index + 1}. ID: "${node.id}", тип: "${node.type}", команда: "${node.data?.command || 'НЕТ'}", showInMenu: ${node.data?.showInMenu}, описание: "${node.data?.description || 'НЕТ'}"`);
          });

          const commandNodes = nodes.filter((node: any) => 
            (node.type === 'start' || node.type === 'command') && 
            node.data?.showInMenu && 
            node.data?.command
          );
          console.log('🎯 ExportModal: Узлы с командами (после фильтрации):', commandNodes.length);
          console.log('🎯 ExportModal: Команды для меню:', commandNodes.map((node: any) => `${node.data.command} - ${node.data.description || 'Без описания'}`));
          
          const botFatherCmds = commands.generateBotFatherCommands(nodes);
          setBotFatherCommands(botFatherCmds);
        } catch (error) {
          console.error('Error loading BotFather commands:', error);
        }
      }
    }
    
    loadBotFatherCommands();
  }, [isOpen, freshBotData, botData]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh] w-full' : 'max-w-7xl max-h-[85vh] w-[95vw]'} flex flex-col overflow-hidden`}>
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center space-x-3">
            <i className="fas fa-download text-primary"></i>
            <span className={`${isMobile ? 'text-sm' : ''}`}>Экспорт кода бота</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stats" className="flex flex-col flex-1 mt-2 min-h-0">
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

          <TabsContent value="stats" className="space-y-4 overflow-y-auto flex-1 min-h-0">
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

          <TabsContent value="validation" className="space-y-4 overflow-y-auto flex-1 min-h-0">
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

          <TabsContent value="files" className="space-y-4 overflow-y-auto flex-1 min-h-0">
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
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard()} className={`${isMobile ? 'w-full' : ''}`}>
                      <i className="fas fa-copy mr-2"></i>
                      Копировать
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadFile()} className={`${isMobile ? 'w-full' : ''}`}>
                      <i className="fas fa-download mr-2"></i>
                      Скачать
                    </Button>
                    <Button size="sm" onClick={downloadAllFiles} className={`${isMobile ? 'w-full' : ''}`}>
                      <i className="fas fa-archive mr-2"></i>
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
                  />
                ) : (
                  <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg text-center text-muted-foreground border border-muted dark:border-muted/40">
                    <i className="fas fa-exclamation-triangle mb-2 text-yellow-500 dark:text-yellow-400"></i>
                    <p>Исправьте ошибки валидации для экспорта файлов</p>
                  </div>
                )}
                
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 md:grid-cols-3 gap-3'} mt-4`}>
                  {(['python', 'json', 'requirements', 'readme', 'dockerfile', 'config'] as ExportFormat[]).map(format => (
                    <div key={format} className={`${isMobile ? 'p-2' : 'p-3'} border border-muted dark:border-muted/40 rounded-lg hover:bg-muted/50 dark:hover:bg-muted/20 cursor-pointer transition-colors ${format === selectedFormat ? 'bg-primary/10 dark:bg-primary/20 border-primary/50 dark:border-primary/40' : ''}`} onClick={() => setSelectedFormat(format)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'} text-foreground`}>{getFileName(format)}</div>
                          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>{format === selectedFormat ? 'Выбрано' : 'Нажмите для просмотра'}</div>
                        </div>
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); downloadFile(format); }}>
                          <i className="fas fa-download text-xs"></i>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-4 overflow-y-auto flex-1 min-h-0">
            <Card>
              <CardHeader className={`${isMobile ? 'flex flex-col space-y-4' : 'flex flex-row items-center justify-between'}`}>
                <div>
                  <CardTitle>Сгенерированный Python код</CardTitle>
                  <CardDescription>Готовый к использованию код для aiogram 3.x</CardDescription>
                </div>
                <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
                  <Button onClick={() => copyToClipboard(exportContent.python)} variant="outline" size="sm" className={`${isMobile ? 'w-full' : ''}`}>
                    <i className="fas fa-copy mr-2"></i>
                    Копировать
                  </Button>
                  <Button onClick={() => downloadFile('python')} size="sm" className={`${isMobile ? 'w-full' : ''}`}>
                    <i className="fas fa-download mr-2"></i>
                    Скачать
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {validationResult.isValid ? (
                  <Textarea
                    value={exportContent.python}
                    readOnly
                    className={`${isMobile ? 'min-h-[300px] max-h-[400px]' : 'min-h-[400px] max-h-[600px]'} font-mono ${isMobile ? 'text-xs' : 'text-sm'} bg-muted/50 dark:bg-muted/20 border-muted dark:border-muted/40 resize-none`}
                    placeholder="Генерация кода..."
                  />
                ) : (
                  <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg text-center text-muted-foreground border border-muted dark:border-muted/40">
                    <i className="fas fa-exclamation-triangle mb-2 text-yellow-500 dark:text-yellow-400"></i>
                    <p>Исправьте ошибки валидации для генерации кода</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-3 overflow-y-auto flex-1 min-h-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-cogs text-blue-500"></i>
                  <span>Настройка бота в @BotFather</span>
                </CardTitle>
                <CardDescription>Команды для настройки меню вашего бота</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {botFatherCommands ? (
                  <div>
                    <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-between items-center'} mb-2`}>
                      <h4 className="font-medium">Команды для @BotFather:</h4>
                      <Button 
                        onClick={() => navigator.clipboard.writeText(botFatherCommands)}
                        variant="outline" 
                        size="sm"
                        className={`${isMobile ? 'w-full' : ''}`}
                      >
                        <i className="fas fa-copy mr-2"></i>
                        Копировать
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Скопируйте и отправьте @BotFather для настройки меню команд:
                    </p>
                    <Textarea
                      value={botFatherCommands}
                      readOnly
                      className={`${isMobile ? 'min-h-[120px] max-h-[200px]' : 'min-h-[150px] max-h-[300px]'} font-mono ${isMobile ? 'text-xs' : 'text-sm'} bg-muted/50 dark:bg-muted/20 border-muted dark:border-muted/40 resize-none`}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg text-center text-muted-foreground border border-muted dark:border-muted/40">
                    <p>Нет команд для настройки в меню</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium">Подробная инструкция по запуску:</h4>
                  
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800/40">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Шаг 1: Подготовка окружения</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                      <li>Убедитесь, что у вас установлен Python 3.8 или выше</li>
                      <li>Создайте папку для вашего бота и перейдите в неё</li>
                      <li>Скачайте все необходимые файлы (Python код, requirements.txt, README.md)</li>
                      <li>Рекомендуется создать виртуальное окружение:
                        <div className="mt-2 space-y-2">
                          <div className="bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">Создание виртуального окружения:</span>
                              <Button 
                                onClick={() => navigator.clipboard.writeText('python -m venv venv')}
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2"
                              >
                                <i className="fas fa-copy text-xs"></i>
                              </Button>
                            </div>
                            <code className="text-sm font-mono">python -m venv venv</code>
                          </div>
                          <div className="bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">Активация (Linux/Mac):</span>
                              <Button 
                                onClick={() => navigator.clipboard.writeText('source venv/bin/activate')}
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2"
                              >
                                <i className="fas fa-copy text-xs"></i>
                              </Button>
                            </div>
                            <code className="text-sm font-mono">source venv/bin/activate</code>
                          </div>
                          <div className="bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">Активация (Windows):</span>
                              <Button 
                                onClick={() => navigator.clipboard.writeText('venv\\Scripts\\activate')}
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2"
                              >
                                <i className="fas fa-copy text-xs"></i>
                              </Button>
                            </div>
                            <code className="text-sm font-mono">venv\Scripts\activate</code>
                          </div>
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800/40">
                    <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">Шаг 2: Установка зависимостей</h5>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200 mb-2">Рекомендуемый способ - установка новых версий:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Команда для установки:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('pip install "aiogram>=3.21.0" "aiohttp>=3.12.13" "requests>=2.32.4" python-dotenv aiofiles')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono break-all">pip install "aiogram&gt;=3.21.0" "aiohttp&gt;=3.12.13" "requests&gt;=2.32.4" python-dotenv aiofiles</code>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200 mb-2">Альтернативный способ - через requirements.txt:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Команда для установки:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('pip install -r requirements.txt')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">pip install -r requirements.txt</code>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200 mb-2">При ошибках компиляции - используйте бинарные пакеты:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Команда для установки:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('pip install --only-binary=all aiogram aiohttp requests python-dotenv aiofiles')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono break-all">pip install --only-binary=all aiogram aiohttp requests python-dotenv aiofiles</code>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200 mb-2">Проверка установки:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Команда для проверки:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('python -c "import aiogram; print(aiogram.__version__)"')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">python -c "import aiogram; print(aiogram.__version__)"</code>
                        </div>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-2">Убедитесь что версия aiogram 3.x (например, 3.21.0+)</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800/40">
                    <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Шаг 3: Настройка бота</h5>
                    <div className="space-y-3 text-sm">
                      <div className="text-amber-700 dark:text-amber-300">
                        <div className="font-medium mb-2">1. Откройте файл бота:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Имя файла:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText(`${projectName.replace(/\s+/g, '_')}_bot.py`)}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">{projectName.replace(/\s+/g, '_')}_bot.py</code>
                        </div>
                      </div>

                      <div className="text-amber-700 dark:text-amber-300">
                        <div className="font-medium mb-2">2. Найдите и замените токен бота:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Строка для поиска:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"</code>
                        </div>
                      </div>

                      <div className="text-amber-700 dark:text-amber-300">
                        <div className="font-medium mb-2">3. Настройте администраторов:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Строка для поиска:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('ADMIN_IDS = [123456789]')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">ADMIN_IDS = [123456789]</code>
                        </div>
                        <p className="text-xs mt-2">Замените 123456789 на ваш Telegram ID (узнать можно у @userinfobot)</p>
                      </div>

                      <div className="text-amber-700 dark:text-amber-300">
                        <div className="font-medium mb-2">4. Узнайте ваш Telegram ID:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Бот для получения ID:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('@userinfobot')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">@userinfobot</code>
                        </div>
                        <p className="text-xs mt-2">Напишите этому боту /start и он отправит ваш ID</p>
                      </div>

                      <div className="text-amber-700 dark:text-amber-300 font-medium">
                        5. Сохраните файл после внесения изменений
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800/40">
                    <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Шаг 4: Запуск и тестирование</h5>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-purple-800 dark:text-purple-200 mb-2">Запуск бота:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Команда для запуска:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText(`python ${projectName.replace(/\s+/g, '_')}_bot.py`)}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">python {projectName.replace(/\s+/g, '_')}_bot.py</code>
                        </div>
                      </div>
                      
                      <div className="text-purple-700 dark:text-purple-300 space-y-1">
                        <div>• Дождитесь сообщения "Бот запущен и готов к работе!"</div>
                        <div>• Найдите вашего бота в Telegram и отправьте команду /start</div>
                        <div>• Проверьте работу всех команд и кнопок</div>
                        <div>• Для остановки бота нажмите <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded">Ctrl+C</code> в терминале</div>
                      </div>
                      
                      <div className="mt-4 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800/40">
                        <div className="font-medium text-amber-800 dark:text-amber-200 mb-2">🖥️ Для пользователей Windows:</div>
                        <div className="text-amber-700 dark:text-amber-300 text-sm space-y-2">
                          <div>Если видите ошибку кодировки (emoji не отображаются), выполните:</div>
                          <div className="bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                            <div className="flex justify-between items-center">
                              <code className="text-sm font-mono">chcp 65001</code>
                              <Button 
                                onClick={() => navigator.clipboard.writeText('chcp 65001')}
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2"
                              >
                                <i className="fas fa-copy text-xs"></i>
                              </Button>
                            </div>
                          </div>
                          <div>Затем запустите бот обычным способом. Эта команда включает поддержку UTF-8.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="bg-cyan-50 dark:bg-cyan-950/30 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800/40">
                  <h5 className="font-medium text-cyan-800 dark:text-cyan-200 mb-2">Шаг 5: База данных (опционально)</h5>
                  <div className="space-y-3 text-sm">
                    <div className="text-cyan-700 dark:text-cyan-300">
                      <div className="font-medium mb-2">По умолчанию бот использует встроенную базу данных SQLite</div>
                      <div className="space-y-2 text-sm">
                        <div>• Автоматически создается файл <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded">bot_database.db</code></div>
                        <div>• Сохраняет данные пользователей, ответы на вопросы, статистику</div>
                        <div>• Не требует дополнительной настройки</div>
                        <div>• Подходит для большинства ботов</div>
                      </div>
                    </div>

                    <div className="text-cyan-700 dark:text-cyan-300">
                      <div className="font-medium mb-2">Для больших проектов можно настроить PostgreSQL:</div>
                      <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">Установка PostgreSQL:</span>
                          <Button 
                            onClick={() => navigator.clipboard.writeText('pip install asyncpg')}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2"
                          >
                            <i className="fas fa-copy text-xs mr-1"></i>
                            <span className="text-xs">Копировать</span>
                          </Button>
                        </div>
                        <code className="text-sm font-mono">pip install asyncpg</code>
                      </div>
                    </div>

                    <div className="text-cyan-700 dark:text-cyan-300">
                      <div className="font-medium mb-2">Настройка подключения к PostgreSQL:</div>
                      <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border space-y-2">
                        <div className="text-xs text-muted-foreground mb-1">Найдите в коде бота строку:</div>
                        <code className="text-sm font-mono block">DATABASE_URL = "sqlite:///bot_database.db"</code>
                        <div className="text-xs text-muted-foreground mb-1">Замените на:</div>
                        <code className="text-sm font-mono block break-all">DATABASE_URL = "postgresql://user:password@localhost/dbname"</code>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('DATABASE_URL = "postgresql://user:password@localhost/dbname"')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 mt-2"
                        >
                          <i className="fas fa-copy text-xs mr-1"></i>
                          <span className="text-xs">Копировать</span>
                        </Button>
                      </div>
                    </div>

                    <div className="text-cyan-700 dark:text-cyan-300 space-y-1">
                      <div className="font-medium">Что сохраняется в базе данных:</div>
                      <div className="ml-4 space-y-1 text-sm">
                        <div>• <strong>Пользователи:</strong> ID, имя, дата регистрации</div>
                        <div>• <strong>Ответы:</strong> все ответы на вопросы и выбранные кнопки</div>
                        <div>• <strong>Статистика:</strong> количество использований команд</div>
                        <div>• <strong>Медиа:</strong> информация о загруженных файлах</div>
                        <div>• <strong>Сессии:</strong> состояние многошагових диалогов</div>
                      </div>
                    </div>

                    <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                      <div className="text-xs text-muted-foreground mb-1">Просмотр данных (SQLite):</div>
                      <div className="space-y-2">
                        <div>
                          <code className="text-sm font-mono">sqlite3 bot_database.db</code>
                          <Button 
                            onClick={() => navigator.clipboard.writeText('sqlite3 bot_database.db')}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 ml-2"
                          >
                            <i className="fas fa-copy text-xs"></i>
                          </Button>
                        </div>
                        <div>
                          <code className="text-sm font-mono">.tables</code>
                          <Button 
                            onClick={() => navigator.clipboard.writeText('.tables')}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 ml-2"
                          >
                            <i className="fas fa-copy text-xs"></i>
                          </Button>
                        </div>
                        <div>
                          <code className="text-sm font-mono">SELECT * FROM users LIMIT 10;</code>
                          <Button 
                            onClick={() => navigator.clipboard.writeText('SELECT * FROM users LIMIT 10;')}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 ml-2"
                          >
                            <i className="fas fa-copy text-xs"></i>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="text-cyan-700 dark:text-cyan-300">
                      <div className="font-medium mb-2">Резервное копирование данных:</div>
                      <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border space-y-2">
                        <div className="text-xs text-muted-foreground mb-1">Создание резервной копии (SQLite):</div>
                        <div>
                          <code className="text-sm font-mono">cp bot_database.db bot_database_backup_$(date +%Y%m%d).db</code>
                          <Button 
                            onClick={() => navigator.clipboard.writeText('cp bot_database.db bot_database_backup_$(date +%Y%m%d).db')}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 ml-2"
                          >
                            <i className="fas fa-copy text-xs"></i>
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Экспорт в CSV:</div>
                        <div>
                          <code className="text-sm font-mono">sqlite3 -header -csv bot_database.db "SELECT * FROM users;" &gt; users.csv</code>
                          <Button 
                            onClick={() => navigator.clipboard.writeText('sqlite3 -header -csv bot_database.db "SELECT * FROM users;" > users.csv')}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 ml-2"
                          >
                            <i className="fas fa-copy text-xs"></i>
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="text-cyan-700 dark:text-cyan-300 text-sm space-y-1">
                      <div className="font-medium">Важные файлы для резервного копирования:</div>
                      <div className="ml-4 space-y-1">
                        <div>• <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded">bot_database.db</code> - основная база данных</div>
                        <div>• <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded">uploads/</code> - папка с медиафайлами пользователей</div>
                        <div>• <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded">*.py</code> - файлы кода бота</div>
                        <div>• <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded">config.yaml</code> - конфигурационные файлы</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="font-medium">Настройка меню команд в @BotFather:</h4>
                  
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
                    <h5 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Автоматическая настройка меню</h5>
                    <div className="space-y-3 text-sm">
                      <div className="text-indigo-700 dark:text-indigo-300 space-y-1">
                        <div>1. Найдите @BotFather в Telegram</div>
                        <div>2. Отправьте команду настройки меню:</div>
                      </div>
                      
                      <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-muted-foreground">Команда для настройки меню:</span>
                          <Button 
                            onClick={() => navigator.clipboard.writeText('/setcommands')}
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2"
                          >
                            <i className="fas fa-copy text-xs mr-1"></i>
                            <span className="text-xs">Копировать</span>
                          </Button>
                        </div>
                        <code className="text-sm font-mono">/setcommands</code>
                      </div>

                      <div className="text-indigo-700 dark:text-indigo-300 space-y-1">
                        <div>3. Выберите своего бота из списка</div>
                        <div>4. Скопируйте команды из раздела "Команды для @BotFather" выше</div>
                        <div>5. Вставьте команды в чат с @BotFather и отправьте</div>
                        <div>6. Получите подтверждение "Ok, command list updated"</div>
                        <div>7. Команды автоматически появятся в меню бота с описаниями</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                    <h6 className="font-medium text-foreground mb-3">Дополнительные настройки @BotFather:</h6>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">/setdescription</code>
                          <span className="text-sm text-muted-foreground">- установить описание бота</span>
                        </div>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('/setdescription')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                        >
                          <i className="fas fa-copy text-xs"></i>
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">/setuserpic</code>
                          <span className="text-sm text-muted-foreground">- установить фото профиля</span>
                        </div>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('/setuserpic')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                        >
                          <i className="fas fa-copy text-xs"></i>
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">/setname</code>
                          <span className="text-sm text-muted-foreground">- изменить имя бота</span>
                        </div>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('/setname')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                        >
                          <i className="fas fa-copy text-xs"></i>
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between bg-muted/30 dark:bg-muted/10 p-2 rounded border">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono">/setabouttext</code>
                          <span className="text-sm text-muted-foreground">- установить текст "О боте"</span>
                        </div>
                        <Button 
                          onClick={() => navigator.clipboard.writeText('/setabouttext')}
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2"
                        >
                          <i className="fas fa-copy text-xs"></i>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="font-medium">Описание экспортируемых файлов:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                      <h6 className="font-medium text-foreground mb-1">Python код (.py)</h6>
                      <p className="text-sm text-muted-foreground">Основной файл бота с логикой обработки команд, сообщений, кнопок и медиаконтента. Использует aiogram 3.x с поддержкой локальных файлов и геолокации.</p>
                    </div>
                    
                    <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                      <h6 className="font-medium text-foreground mb-1">JSON данные (.json)</h6>
                      <p className="text-sm text-muted-foreground">Структурированные данные бота для импорта в другие системы или резервного копирования.</p>
                    </div>
                    
                    <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                      <h6 className="font-medium text-foreground mb-1">Зависимости (.txt)</h6>
                      <p className="text-sm text-muted-foreground">Файл requirements.txt со всеми необходимыми Python библиотеками для работы бота.</p>
                    </div>
                    
                    <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                      <h6 className="font-medium text-foreground mb-1">Документация (.md)</h6>
                      <p className="text-sm text-muted-foreground">README файл с подробным описанием бота, его функций и инструкцией по установке.</p>
                    </div>
                    
                    <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                      <h6 className="font-medium text-foreground mb-1">Dockerfile</h6>
                      <p className="text-sm text-muted-foreground">Конфигурация для контейнеризации бота с помощью Docker для простого развертывания.</p>
                    </div>
                    
                    <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                      <h6 className="font-medium text-foreground mb-1">Конфигурация (.yaml)</h6>
                      <p className="text-sm text-muted-foreground">Файл конфигурации для развертывания бота на серверах с автоматической настройкой.</p>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="font-medium">Тестирование и отладка:</h4>
                  
                  <div className="bg-teal-50 dark:bg-teal-950/30 p-4 rounded-lg border border-teal-200 dark:border-teal-800/40">
                    <h5 className="font-medium text-teal-800 dark:text-teal-200 mb-2">Шаг 5: Проверка функций бота</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-teal-700 dark:text-teal-300">
                      <li>Протестируйте все команды и убедитесь что они отвечают</li>
                      <li>Проверьте inline кнопки - они должны реагировать на нажатия</li>
                      <li>Если есть медиафайлы - убедитесь что они отправляются корректно</li>
                      <li>Для локальных файлов создайте папку "uploads" и поместите туда медиафайлы</li>
                      <li>Проверьте геолокацию - кнопки карт должны открывать правильные координаты</li>
                      <li>Если бот не отвечает - проверьте логи в терминале на наличие ошибок</li>
                    </ol>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-lg border border-orange-200 dark:border-orange-800/40">
                    <h5 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Решение проблем:</h5>
                    <div className="space-y-3 text-sm">
                      <div>
                        <div className="font-medium text-orange-800 dark:text-orange-200 mb-2">Ошибка при установке (Rust required):</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Команда с бинарными пакетами:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('pip install --only-binary=all aiogram aiohttp requests python-dotenv aiofiles')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono break-all">pip install --only-binary=all aiogram aiohttp requests python-dotenv aiofiles</code>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-orange-800 dark:text-orange-200 mb-2">Проблемы с pydantic-core:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Обновление инструментов:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('pip install --upgrade pip setuptools wheel')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">pip install --upgrade pip setuptools wheel</code>
                        </div>
                      </div>

                      <div>
                        <div className="font-medium text-orange-800 dark:text-orange-200 mb-2">Переустановка aiogram при ошибках:</div>
                        <div className="bg-muted/30 dark:bg-muted/10 p-3 rounded border">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs text-muted-foreground">Команда обновления:</span>
                            <Button 
                              onClick={() => navigator.clipboard.writeText('pip install --upgrade aiogram')}
                              variant="ghost" 
                              size="sm" 
                              className="h-6 px-2"
                            >
                              <i className="fas fa-copy text-xs mr-1"></i>
                              <span className="text-xs">Копировать</span>
                            </Button>
                          </div>
                          <code className="text-sm font-mono">pip install --upgrade aiogram</code>
                        </div>
                      </div>

                      <div className="text-orange-700 dark:text-orange-300 space-y-1">
                        <div>• <strong>Бот не запускается:</strong> Проверьте токен и версию aiogram</div>
                        <div>• <strong>Команды не работают:</strong> Убедитесь что они настроены в @BotFather</div>
                        <div>• <strong>Inline кнопки не реагируют:</strong> Проверьте callback обработчики в коде</div>
                        <div>• <strong>Медиафайлы не отправляются:</strong> Убедитесь что файлы существуют в папке uploads</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="bg-cyan-50 dark:bg-cyan-950/30 p-4 rounded-lg border border-cyan-200 dark:border-cyan-800/40">
                  <h5 className="font-medium text-cyan-800 dark:text-cyan-200 mb-2">🚀 Новые возможности бота:</h5>
                  <ul className="text-sm text-cyan-700 dark:text-cyan-300 space-y-1">
                    <li>• <strong>Медиаконтент:</strong> Поддержка фото, видео, аудио и документов</li>
                    <li>• <strong>Локальные файлы:</strong> Автоматическая работа с загруженными файлами</li>
                    <li>• <strong>Геолокация:</strong> Интеграция с Яндекс.Карты, Google Maps, 2ГИС</li>
                    <li>• <strong>Умные клавиатуры:</strong> Поддержка inline и reply кнопок</li>
                    <li>• <strong>Синонимы команд:</strong> Дополнительные варианты активации команд</li>
                    <li>• <strong>Права доступа:</strong> Админские команды и приватные чаты</li>
                    <li>• <strong>Обработка ошибок:</strong> Автоматическое логирование и уведомления</li>
                  </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800/40">
                  <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">⚠️ Важные замечания:</h5>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• Никогда не публикуйте токен бота в открытом доступе</li>
                    <li>• Регулярно обновляйте токен бота при подозрении на компрометацию</li>
                    <li>• Для продакшена используйте переменные окружения для хранения токена</li>
                    <li>• Тестируйте бота в приватном чате перед публикацией</li>
                    <li>• Сохраняйте резервные копии кода и настроек</li>
                    <li>• Для медиафайлов создайте папку "uploads" рядом с кодом бота</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 overflow-y-auto flex-1 min-h-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-download text-blue-500"></i>
                  <span>Мобильный экспорт</span>
                </CardTitle>
                <CardDescription>Быстрые действия для экспорта</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-4 py-5">
                <div className="grid grid-cols-1 gap-4">
                  <Button size="lg" onClick={async () => { setSelectedFormat('python'); await downloadFile('python'); }} variant="outline" className="h-16 flex-col space-y-1" data-testid="button-download-python">
                    <i className="fas fa-code text-xl text-blue-500"></i>
                    <span className="font-medium">Скачать Python код</span>
                  </Button>
                  
                  <Button size="lg" onClick={async () => { setSelectedFormat('json'); await downloadFile('json'); }} variant="outline" className="h-16 flex-col space-y-1" data-testid="button-download-json">
                    <i className="fas fa-database text-xl text-green-500"></i>
                    <span className="font-medium">Скачать JSON данные</span>
                  </Button>
                  
                  <Button size="lg" onClick={downloadAllFiles} className="h-16 flex-col space-y-1" data-testid="button-download-all">
                    <i className="fas fa-archive text-xl"></i>
                    <span className="font-medium">Скачать все файлы</span>
                  </Button>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-base">Остальные файлы проекта:</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <Button size="sm" variant="ghost" onClick={() => downloadFile('requirements')} className="h-auto p-3 flex-col space-y-1 border border-muted" data-testid="button-download-requirements">
                      <i className="fas fa-list text-lg text-orange-500"></i>
                      <span className="font-medium">Зависимости</span>
                      <span className="text-xs text-muted-foreground">.txt</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadFile('readme')} className="h-auto p-3 flex-col space-y-1 border border-muted" data-testid="button-download-readme">
                      <i className="fas fa-file-alt text-lg text-purple-500"></i>
                      <span className="font-medium">Документация</span>
                      <span className="text-xs text-muted-foreground">.md</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadFile('dockerfile')} className="h-auto p-3 flex-col space-y-1 border border-muted" data-testid="button-download-dockerfile">
                      <i className="fab fa-docker text-lg text-cyan-500"></i>
                      <span className="font-medium">Docker</span>
                      <span className="text-xs text-muted-foreground">Контейнер</span>
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadFile('config')} className="h-auto p-3 flex-col space-y-1 border border-muted" data-testid="button-download-config">
                      <i className="fas fa-cogs text-lg text-yellow-500"></i>
                      <span className="font-medium">Конфиг</span>
                      <span className="text-xs text-muted-foreground">.yaml</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
