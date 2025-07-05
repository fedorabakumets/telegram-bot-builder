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
import { BotData } from '@/types/bot';
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
    totalNodes: botData.nodes.length,
    commandNodes: botData.nodes.filter(node => node.type === 'start' || node.type === 'command').length,
    messageNodes: botData.nodes.filter(node => node.type === 'message').length,
    photoNodes: botData.nodes.filter(node => node.type === 'photo').length,
    keyboardNodes: botData.nodes.filter(node => node.data.keyboardType !== 'none').length,
    totalButtons: botData.nodes.reduce((sum, node) => sum + node.data.buttons.length, 0),
    commandsInMenu: botData.nodes.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data.showInMenu
    ).length,
    adminOnlyCommands: botData.nodes.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data.adminOnly
    ).length,
    privateOnlyCommands: botData.nodes.filter(node => 
      (node.type === 'start' || node.type === 'command') && node.data.isPrivateOnly
    ).length
  };

  useEffect(() => {
    if (isOpen) {
      const validation = validateBotStructure(botData);
      setValidationResult(validation);
      
      if (validation.isValid) {
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
      const botFatherCmds = generateBotFatherCommands(botData.nodes);
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
                      <Badge variant="outline">{botData.connections.length}</Badge>
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
                      {validationResult.errors.map((error, index) => (
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
                        <div className="mt-1 ml-4">
                          <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded text-xs border border-muted dark:border-muted/60">python -m venv venv</code><br />
                          <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded text-xs border border-muted dark:border-muted/60">source venv/bin/activate</code> (Linux/Mac) или<br />
                          <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded text-xs border border-muted dark:border-muted/60">venv\Scripts\activate</code> (Windows)
                        </div>
                      </li>
                    </ol>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800/40">
                    <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">Шаг 2: Установка зависимостей</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-green-700 dark:text-green-300">
                      <li>Установите aiogram (версия 3.x): <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">pip install aiogram</code></li>
                      <li>Или используйте файл requirements.txt: <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">pip install -r requirements.txt</code></li>
                      <li>Проверьте установку: <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">python -c "import aiogram; print(aiogram.__version__)"</code></li>
                    </ol>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800/40">
                    <h5 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Шаг 3: Настройка бота</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
                      <li>Откройте файл <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">{projectName.replace(/\s+/g, '_')}_bot.py</code></li>
                      <li>Найдите строку <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">BOT_TOKEN = "YOUR_BOT_TOKEN_HERE"</code></li>
                      <li>Замените <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">YOUR_BOT_TOKEN_HERE</code> на токен вашего бота от @BotFather</li>
                      <li>Найдите строку <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">ADMIN_IDS = [123456789]</code></li>
                      <li>Замените <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">123456789</code> на ваш Telegram ID (можно узнать у @userinfobot)</li>
                      <li>Сохраните файл</li>
                    </ol>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-lg border border-purple-200 dark:border-purple-800/40">
                    <h5 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Шаг 4: Запуск и тестирование</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-purple-700 dark:text-purple-300">
                      <li>Запустите бота: <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">python {projectName.replace(/\s+/g, '_')}_bot.py</code></li>
                      <li>Дождитесь сообщения "Бот запущен и готов к работе!"</li>
                      <li>Найдите вашего бота в Telegram и отправьте команду /start</li>
                      <li>Проверьте работу всех команд и кнопок</li>
                      <li>Для остановки бота нажмите Ctrl+C в терминале</li>
                    </ol>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="font-medium">Настройка меню команд в @BotFather:</h4>
                  
                  <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/40">
                    <h5 className="font-medium text-indigo-800 dark:text-indigo-200 mb-2">Автоматическая настройка меню</h5>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-700 dark:text-indigo-300">
                      <li>Найдите @BotFather в Telegram</li>
                      <li>Отправьте команду <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">/setcommands</code></li>
                      <li>Выберите своего бота из списка</li>
                      <li>Скопируйте команды из раздела "Команды для @BotFather" выше</li>
                      <li>Вставьте команды в чат с @BotFather и отправьте</li>
                      <li>Получите подтверждение "Ok, command list updated"</li>
                    </ol>
                  </div>

                  <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                    <h6 className="font-medium text-foreground mb-1">Дополнительные настройки @BotFather:</h6>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">/setdescription</code> - установить описание бота</li>
                      <li>• <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">/setuserpic</code> - установить фото профиля</li>
                      <li>• <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">/setname</code> - изменить имя бота</li>
                      <li>• <code className="bg-muted/60 dark:bg-muted/40 px-1 rounded border border-muted dark:border-muted/60">/setabouttext</code> - установить текст "О боте"</li>
                    </ul>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <h4 className="font-medium">Описание экспортируемых файлов:</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-muted/50 dark:bg-muted/20 p-3 rounded-lg border border-muted dark:border-muted/40">
                      <h6 className="font-medium text-foreground mb-1">Python код (.py)</h6>
                      <p className="text-sm text-muted-foreground">Основной файл бота с логикой обработки команд, сообщений и кнопок. Использует aiogram 3.x.</p>
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

                <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg border border-red-200 dark:border-red-800/40">
                  <h5 className="font-medium text-red-800 dark:text-red-200 mb-2">⚠️ Важные замечания:</h5>
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    <li>• Никогда не публикуйте токен бота в открытом доступе</li>
                    <li>• Регулярно обновляйте токен бота при подозрении на компрометацию</li>
                    <li>• Для продакшена используйте переменные окружения для хранения токена</li>
                    <li>• Тестируйте бота в приватном чате перед публикацией</li>
                    <li>• Сохраняйте резервные копии кода и настроек</li>
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
