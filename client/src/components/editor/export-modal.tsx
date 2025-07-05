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
      <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[95vh] w-full' : 'max-w-6xl max-h-[90vh] w-[90vw]'} flex flex-col p-4`}>
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center space-x-3">
            <i className="fas fa-download text-primary"></i>
            <span className={`${isMobile ? 'text-sm' : ''}`}>Экспорт кода бота</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stats" className="flex flex-col mt-2">
          <TabsList className={`${isMobile ? 'grid w-full grid-cols-2' : 'grid w-full grid-cols-5'} flex-shrink-0`}>
            <TabsTrigger value="stats" className={`${isMobile ? 'text-xs' : ''}`}>Статистика</TabsTrigger>
            <TabsTrigger value="validation" className={`${isMobile ? 'text-xs' : ''}`}>Валидация</TabsTrigger>
            {!isMobile && <TabsTrigger value="files">Файлы</TabsTrigger>}
            {!isMobile && <TabsTrigger value="code">Код</TabsTrigger>}
            {!isMobile && <TabsTrigger value="setup">Настройка</TabsTrigger>}
            {isMobile && <TabsTrigger value="export" className="text-xs">Экспорт</TabsTrigger>}
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
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
                  <div className={`bg-blue-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-blue-600`}>{botStats.totalNodes}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-blue-700`}>Всего узлов</div>
                  </div>
                  <div className={`bg-green-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-green-600`}>{botStats.commandNodes}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-green-700`}>Команд</div>
                  </div>
                  <div className={`bg-purple-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-purple-600`}>{botStats.totalButtons}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-purple-700`}>Кнопок</div>
                  </div>
                  <div className={`bg-amber-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-amber-600`}>{botStats.keyboardNodes}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-amber-700`}>С клавиатурой</div>
                  </div>
                  <div className={`bg-indigo-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-indigo-600`}>{botStats.commandsInMenu}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-indigo-700`}>В меню</div>
                  </div>
                  <div className={`bg-red-50 rounded-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                    <div className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-red-600`}>{botStats.adminOnlyCommands}</div>
                    <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-red-700`}>Только админ</div>
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

          <TabsContent value="validation" className="space-y-4">
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
                  <div className="flex items-center space-x-2 text-green-600 p-4 bg-green-50 rounded-lg">
                    <i className="fas fa-check-circle"></i>
                    <span className="font-medium">Структура бота корректна и готова к экспорту!</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 text-red-600 p-3 bg-red-50 rounded-lg">
                      <i className="fas fa-exclamation-triangle"></i>
                      <span className="font-medium">Найдены ошибки в структуре бота:</span>
                    </div>
                    <div className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="flex items-start space-x-2 p-3 bg-red-50 rounded border-l-4 border-red-200">
                          <i className="fas fa-times-circle text-red-500 mt-0.5"></i>
                          <span className="text-sm text-red-700">{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
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
                    className={`${isMobile ? 'min-h-[200px]' : 'min-h-[350px]'} font-mono ${isMobile ? 'text-xs' : 'text-sm'} bg-gray-50`}
                    placeholder="Выберите формат для просмотра..."
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    <i className="fas fa-exclamation-triangle mb-2"></i>
                    <p>Исправьте ошибки валидации для экспорта файлов</p>
                  </div>
                )}
                
                <div className={`grid ${isMobile ? 'grid-cols-1 gap-2' : 'grid-cols-2 md:grid-cols-3 gap-3'} mt-4`}>
                  {(['python', 'json', 'requirements', 'readme', 'dockerfile', 'config'] as ExportFormat[]).map(format => (
                    <div key={format} className={`${isMobile ? 'p-2' : 'p-3'} border rounded-lg hover:bg-gray-50 cursor-pointer`} onClick={() => setSelectedFormat(format)}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={`font-medium ${isMobile ? 'text-xs' : 'text-sm'}`}>{getFileName(format)}</div>
                          <div className={`${isMobile ? 'text-xs' : 'text-xs'} text-gray-500`}>{format === selectedFormat ? 'Выбрано' : 'Нажмите для просмотра'}</div>
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

          <TabsContent value="code" className="space-y-4">
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
                    className={`${isMobile ? 'min-h-[300px] max-h-[400px]' : 'min-h-[400px] max-h-[600px]'} font-mono ${isMobile ? 'text-xs' : 'text-sm'} bg-gray-50 resize-none`}
                    placeholder="Генерация кода..."
                  />
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    <i className="fas fa-exclamation-triangle mb-2"></i>
                    <p>Исправьте ошибки валидации для генерации кода</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="setup" className="space-y-3">
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
                    <p className="text-sm text-gray-600 mb-2">
                      Скопируйте и отправьте @BotFather для настройки меню команд:
                    </p>
                    <Textarea
                      value={botFatherCommands}
                      readOnly
                      className={`${isMobile ? 'min-h-[120px] max-h-[200px]' : 'min-h-[150px] max-h-[300px]'} font-mono ${isMobile ? 'text-xs' : 'text-sm'} bg-gray-50 resize-none`}
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    <p>Нет команд для настройки в меню</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-2">
                  <h4 className="font-medium">Инструкция по запуску:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>Скачайте сгенерированный Python файл</li>
                    <li>Установите библиотеку: <code className="bg-gray-100 px-1 rounded">pip install aiogram</code></li>
                    <li>Замените <code className="bg-gray-100 px-1 rounded">YOUR_BOT_TOKEN_HERE</code> на токен вашего бота</li>
                    <li>Добавьте свой Telegram ID в список администраторов</li>
                    <li>Запустите бота: <code className="bg-gray-100 px-1 rounded">python bot.py</code></li>
                  </ol>
                </div>

                <Separator className="my-3" />

                <div className="space-y-2">
                  <h4 className="font-medium">Настройка @BotFather:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>Найдите @BotFather в Telegram</li>
                    <li>Отправьте команду <code className="bg-gray-100 px-1 rounded">/setcommands</code></li>
                    <li>Выберите своего бота</li>
                    <li>Скопируйте и отправьте команды выше</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Мобильная версия объединенного экспорта */}
          {isMobile && (
            <TabsContent value="export" className="space-y-4">
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
                    <div className="bg-gray-50 rounded-lg p-2">
                      <div className="text-xs text-gray-600 mb-2">Предварительный просмотр:</div>
                      <div className="bg-white rounded p-2 max-h-32 overflow-y-auto">
                        <pre className="text-xs font-mono text-gray-800">
                          {exportContent[selectedFormat].substring(0, 200)}...
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                      <i className="fas fa-exclamation-triangle mb-2"></i>
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

          <TabsContent value="code" className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Сгенерированный код</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard()}>
                  <i className="fas fa-copy mr-2"></i>
                  Копировать
                </Button>
                <Button size="sm" onClick={() => downloadFile()}>
                  <i className="fas fa-download mr-2"></i>
                  Скачать
                </Button>
              </div>
            </div>
            
            {validationResult.isValid ? (
              <Textarea
                value={generatedCode}
                readOnly
                className="flex-1 font-mono text-xs resize-none min-h-[300px] max-h-[400px]"
              />
            ) : (
              <div className="flex-1 bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-4"></i>
                  <p className="text-gray-600">Исправьте ошибки в структуре бота для генерации кода</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="instructions" className="flex-1 space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-medium text-green-900 mb-3">
                <i className="fas fa-rocket mr-2"></i>
                Как запустить бота
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-green-800">
                <li>Создайте нового бота у @BotFather в Telegram</li>
                <li>Скопируйте токен бота и замените "YOUR_BOT_TOKEN_HERE" в коде</li>
                <li>Установите aiogram: <code className="bg-green-100 px-2 py-1 rounded">pip install aiogram</code></li>
                <li>Сохраните код в файл (например, bot.py)</li>
                <li>Запустите бота: <code className="bg-green-100 px-2 py-1 rounded">python bot.py</code></li>
              </ol>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                <i className="fas fa-info-circle mr-2"></i>
                Зависимости
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Python:</strong> 3.8 или выше</p>
                <p><strong>aiogram:</strong> 3.x (последняя версия)</p>
                <p><strong>asyncio:</strong> встроен в Python</p>
              </div>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <h4 className="font-medium text-amber-900 mb-2">
                <i className="fas fa-lightbulb mr-2"></i>
                Полезные советы
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-800">
                <li>Протестируйте бота в приватном чате перед публикацией</li>
                <li>Используйте переменные окружения для хранения токена</li>
                <li>Добавьте обработку ошибок для продакшен-среды</li>
                <li>Изучите документацию aiogram для расширения функциональности</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
