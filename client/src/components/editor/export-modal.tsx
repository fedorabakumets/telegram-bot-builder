import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generatePythonCode, validateBotStructure } from '@/lib/bot-generator';
import { generateBotFatherCommands } from '@/lib/commands';
import { BotData } from '@/types/bot';
import { useState, useEffect } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  botData: BotData;
  projectName: string;
}

export function ExportModal({ isOpen, onClose, botData, projectName }: ExportModalProps) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [validationResult, setValidationResult] = useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });
  const [botFatherCommands, setBotFatherCommands] = useState('');
  const { toast } = useToast();

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
        const code = generatePythonCode(botData, projectName);
        setGeneratedCode(code);
      }
      
      // Генерация команд для BotFather
      const botFatherCmds = generateBotFatherCommands(botData.nodes);
      setBotFatherCommands(botFatherCmds);
    }
  }, [isOpen, botData, projectName]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast({
        title: "Код скопирован!",
        description: "Код бота скопирован в буфер обмена",
      });
    } catch (error) {
      toast({
        title: "Ошибка копирования",
        description: "Не удалось скопировать код в буфер обмена",
        variant: "destructive",
      });
    }
  };

  const downloadFile = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '_')}_bot.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Файл загружен!",
      description: "Код бота сохранен в файл",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            <i className="fas fa-download text-primary"></i>
            <span>Экспорт кода бота</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="stats" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="stats">Статистика</TabsTrigger>
            <TabsTrigger value="validation">Валидация</TabsTrigger>
            <TabsTrigger value="code">Python код</TabsTrigger>
            <TabsTrigger value="setup">Настройка</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="flex-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-chart-bar text-blue-500"></i>
                  <span>Статистика бота</span>
                </CardTitle>
                <CardDescription>Обзор структуры и компонентов вашего бота</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{botStats.totalNodes}</div>
                    <div className="text-sm text-blue-700">Всего узлов</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{botStats.commandNodes}</div>
                    <div className="text-sm text-green-700">Команд</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">{botStats.totalButtons}</div>
                    <div className="text-sm text-purple-700">Кнопок</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-amber-600">{botStats.keyboardNodes}</div>
                    <div className="text-sm text-amber-700">С клавиатурой</div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-indigo-600">{botStats.commandsInMenu}</div>
                    <div className="text-sm text-indigo-700">В меню</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-red-600">{botStats.adminOnlyCommands}</div>
                    <div className="text-sm text-red-700">Только админ</div>
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

          <TabsContent value="validation" className="flex-1 space-y-4">
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

          <TabsContent value="code" className="flex-1 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Сгенерированный Python код</CardTitle>
                  <CardDescription>Готовый к использованию код для aiogram 3.x</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={copyToClipboard} variant="outline" size="sm">
                    <i className="fas fa-copy mr-2"></i>
                    Копировать
                  </Button>
                  <Button onClick={downloadFile} size="sm">
                    <i className="fas fa-download mr-2"></i>
                    Скачать
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {validationResult.isValid ? (
                  <Textarea
                    value={generatedCode}
                    readOnly
                    className="min-h-[400px] font-mono text-sm bg-gray-50"
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

          <TabsContent value="setup" className="flex-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <i className="fas fa-cogs text-blue-500"></i>
                  <span>Настройка бота в @BotFather</span>
                </CardTitle>
                <CardDescription>Команды для настройки меню вашего бота</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {botFatherCommands ? (
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Команды для @BotFather:</h4>
                      <Button 
                        onClick={() => navigator.clipboard.writeText(botFatherCommands)}
                        variant="outline" 
                        size="sm"
                      >
                        <i className="fas fa-copy mr-2"></i>
                        Копировать
                      </Button>
                    </div>
                    <Textarea
                      value={botFatherCommands}
                      readOnly
                      className="min-h-[120px] font-mono text-sm bg-gray-50"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    <p>Нет команд для настройки в меню</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium">Инструкция по запуску:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Скачайте сгенерированный Python файл</li>
                    <li>Установите библиотеку: <code className="bg-gray-100 px-1 rounded">pip install aiogram</code></li>
                    <li>Замените <code className="bg-gray-100 px-1 rounded">YOUR_BOT_TOKEN_HERE</code> на токен вашего бота</li>
                    <li>Добавьте свой Telegram ID в список администраторов</li>
                    <li>Запустите бота: <code className="bg-gray-100 px-1 rounded">python bot.py</code></li>
                  </ol>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Настройка @BotFather:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Найдите @BotFather в Telegram</li>
                    <li>Отправьте команду <code className="bg-gray-100 px-1 rounded">/setcommands</code></li>
                    <li>Выберите своего бота</li>
                    <li>Скопируйте и отправьте команды выше</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Сгенерированный код</h3>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <i className="fas fa-copy mr-2"></i>
                  Копировать
                </Button>
                <Button size="sm" onClick={downloadFile}>
                  <i className="fas fa-download mr-2"></i>
                  Скачать
                </Button>
              </div>
            </div>
            
            {validationResult.isValid ? (
              <Textarea
                value={generatedCode}
                readOnly
                className="flex-1 font-mono text-sm resize-none"
                style={{ minHeight: '400px' }}
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
