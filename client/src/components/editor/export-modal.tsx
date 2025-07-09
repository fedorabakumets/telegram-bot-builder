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
import { generatePythonCode, validateBotStructure, generateRequirementsTxt, generateReadme, generateDockerfile, generateConfigYaml } from '@/lib/bot-generator';
import { generateBotFatherCommands } from '@/lib/commands';
import { BotData } from '@shared/schema';
import { useState, useEffect } from 'react';

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

  // Статистика бота
  const botStats = {
    totalNodes: botData?.nodes?.length || 0,
    commandNodes: botData?.nodes?.filter(node => node.type === 'start' || node.type === 'command').length || 0,
    messageNodes: botData?.nodes?.filter(node => node.type === 'message').length || 0,
    photoNodes: botData?.nodes?.filter(node => node.type === 'photo').length || 0,
    keyboardNodes: botData?.nodes?.filter(node => node.data?.keyboardType !== 'none').length || 0,
    totalButtons: botData?.nodes?.reduce((sum, node) => sum + (node.data?.buttons?.length || 0), 0) || 0,
    commandsInMenu: botData?.nodes?.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data?.showInMenu
    ).length || 0,
    adminOnlyCommands: botData?.nodes?.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data?.adminOnly
    ).length || 0,
    privateOnlyCommands: botData?.nodes?.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data?.isPrivateOnly
    ).length || 0
  };

  useEffect(() => {
    if (isOpen && botData) {
      const validation = validateBotStructure(botData);
      setValidationResult(validation || { isValid: false, errors: [] });
      
      if (validation?.isValid) {
        // Generate all export formats
        const pythonCode = generatePythonCode(botData, projectName);
        const jsonData = JSON.stringify(botData, null, 2);
        const requirements = generateRequirementsTxt();
        const readme = generateReadme(botData, projectName);
        const dockerfile = generateDockerfile();
        const config = generateConfigYaml(projectName);
        
        setGeneratedCode(pythonCode);
        setExportContent({
          python: pythonCode,
          json: jsonData,
          requirements: requirements,
          readme: readme,
          dockerfile: dockerfile,
          config: config
        });
      }
      
      // Генерация команд для BotFather
      const botFatherCmds = generateBotFatherCommands(botData?.nodes || []);
      setBotFatherCommands(botFatherCmds);
    }
  }, [isOpen, botData, projectName]);

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
    const textToCopy = content || exportContent[selectedFormat];
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

  const downloadFile = (format?: ExportFormat) => {
    const formatToDownload = format || selectedFormat;
    const content = exportContent[formatToDownload];
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
          <TabsList className={`${isMobile ? 'grid w-full grid-cols-2' : 'grid w-full grid-cols-5'} flex-shrink-0`}>
            <TabsTrigger value="stats" className={`${isMobile ? 'text-xs' : ''}`}>Статистика</TabsTrigger>
            <TabsTrigger value="validation" className={`${isMobile ? 'text-xs' : ''}`}>Валидация</TabsTrigger>
            {!isMobile && <TabsTrigger value="files">Файлы</TabsTrigger>}
            {!isMobile && <TabsTrigger value="code">Код</TabsTrigger>}
            {!isMobile && <TabsTrigger value="setup">Настройка</TabsTrigger>}
            {isMobile && <TabsTrigger value="export" className="text-xs">Экспорт</TabsTrigger>}
          </TabsList>

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
                <div className={`grid ${isMobile ? 'grid-cols-2 gap-2' : 'grid-cols-2 md:grid-cols-3 gap-4'}`}>
                  <div className={`bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-600 dark:text-blue-400`}>{botStats.totalNodes}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700 dark:text-blue-300`}>Всего узлов</div>
                  </div>
                  <div className={`bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600 dark:text-green-400`}>{botStats.commandNodes}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-700 dark:text-green-300`}>Команд</div>
                  </div>
                  <div className={`bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-600 dark:text-purple-400`}>{botStats.totalButtons}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-700 dark:text-purple-300`}>Кнопок</div>
                  </div>
                  <div className={`bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-amber-600 dark:text-amber-400`}>{botStats.keyboardNodes}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-amber-700 dark:text-amber-300`}>С клавиатурой</div>
                  </div>
                  <div className={`bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-indigo-600 dark:text-indigo-400`}>{botStats.commandsInMenu}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-indigo-700 dark:text-indigo-300`}>В меню</div>
                  </div>
                  <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-600 dark:text-red-400`}>{botStats.adminOnlyCommands}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-700 dark:text-red-300`}>Только админ</div>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <h4 className="font-medium">Детальная статистика:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Текстовые сообщения:</span>
                      <Badge variant="secondary">{botStats.messageNodes}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Фото сообщения:</span>
                      <Badge variant="secondary">{botStats.photoNodes}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Приватные команды:</span>
                      <Badge variant="outline">{botStats.privateOnlyCommands}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Соединения между узлами:</span>
                      <Badge variant="outline">{botData?.connections?.length || 0}</Badge>
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
                      <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[200px]'}`}>
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
                    value={exportContent[selectedFormat]}
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

          {/* Мобильная версия объединенного экспорта */}
          {isMobile && (
            <TabsContent value="export" className="space-y-4 overflow-y-auto flex-1 min-h-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <i className="fas fa-download text-blue-500"></i>
                    <span>Экспорт кода</span>
                  </CardTitle>
                  <CardDescription>Выберите формат для экспорта</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <Select value={selectedFormat} onValueChange={(value: ExportFormat) => setSelectedFormat(value)}>
                      <SelectTrigger>
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
                    
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard()} className="flex-1">
                        <i className="fas fa-copy mr-2"></i>
                        Копировать
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadFile()} className="flex-1">
                        <i className="fas fa-download mr-2"></i>
                        Скачать
                      </Button>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {validationResult.isValid ? (
                    <div className="bg-muted/50 dark:bg-muted/20 rounded-lg p-2 border border-muted dark:border-muted/40">
                      <div className="text-xs text-muted-foreground mb-2">Предварительный просмотр:</div>
                      <div className="bg-background dark:bg-background/60 rounded p-2 max-h-32 overflow-y-auto border border-muted dark:border-muted/40">
                        <pre className="text-xs font-mono text-foreground">
                          {exportContent[selectedFormat].substring(0, 200)}...
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-muted/50 dark:bg-muted/20 rounded-lg text-center text-muted-foreground border border-muted dark:border-muted/40">
                      <i className="fas fa-exclamation-triangle mb-2 text-yellow-500 dark:text-yellow-400"></i>
                      <p className="text-sm">Исправьте ошибки валидации для экспорта</p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Быстрый экспорт всех файлов:</h4>
                    <Button size="sm" onClick={downloadAllFiles} className="w-full">
                      <i className="fas fa-archive mr-2"></i>
                      Скачать все файлы
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}


        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
