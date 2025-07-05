import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { generatePythonCode, validateBotStructure } from '@/lib/bot-generator';
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
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const validation = validateBotStructure(botData);
      setValidationResult(validation);
      
      if (validation.isValid) {
        const code = generatePythonCode(botData, projectName);
        setGeneratedCode(code);
      }
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

        <Tabs defaultValue="code" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="validation">Валидация</TabsTrigger>
            <TabsTrigger value="code">Python код</TabsTrigger>
            <TabsTrigger value="instructions">Инструкции</TabsTrigger>
          </TabsList>

          <TabsContent value="validation" className="flex-1 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Проверка структуры бота</h3>
              
              {validationResult.isValid ? (
                <div className="flex items-center space-x-2 text-green-600">
                  <i className="fas fa-check-circle"></i>
                  <span className="text-sm font-medium">Структура бота корректна</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-red-600">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span className="text-sm font-medium">Найдены ошибки:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600 ml-6">
                    {validationResult.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Статистика проекта</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Узлов:</span>
                  <span className="ml-2 font-medium">{botData.nodes.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Соединений:</span>
                  <span className="ml-2 font-medium">{botData.connections.length}</span>
                </div>
                <div>
                  <span className="text-blue-700">Кнопок:</span>
                  <span className="ml-2 font-medium">
                    {botData.nodes.reduce((total, node) => total + node.data.buttons.length, 0)}
                  </span>
                </div>
                <div>
                  <span className="text-blue-700">Команд:</span>
                  <span className="ml-2 font-medium">
                    {botData.nodes.filter(node => node.type === 'start' || node.type === 'command').length}
                  </span>
                </div>
              </div>
            </div>
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
