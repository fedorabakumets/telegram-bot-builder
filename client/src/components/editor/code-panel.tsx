import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { BotData, BotGroup } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import Editor from '@monaco-editor/react';
import { Loader2, X } from 'lucide-react';
import { CodeFormat, useCodeGenerator } from '@/hooks/use-code-generator';

/**
 * Свойства компонента панели кода
 * @interface CodePanelProps
 */
interface CodePanelProps {
  /** Данные бота для генерации кода */
  botData: BotData;
  /** Название проекта */
  projectName: string;
  /** Колбэк для закрытия панели */
  onClose?: () => void;
}

/**
 * Компонент панели просмотра и экспорта кода бота
 * Предоставляет интерфейс для просмотра сгенерированного кода в различных форматах,
 * копирования в буфер обмена и скачивания файлов
 * @param botData - Данные бота для генерации кода
 * @param projectName - Название проекта
 * @param onClose - Функция закрытия панели
 * @returns JSX элемент панели кода
 *
 * Горячие клавиши:
 * - Ctrl+Alt+C / Cmd+Alt+C: Скопировать код в буфер обмена
 * - Ctrl+Alt+S / Cmd+Alt+S: Скачать файл с кодом
 * - Ctrl+Alt+F / Cmd+Alt+F: Переключить сворачивание всех функций/блоков
 * - Esc: Закрыть панель кода (если доступно)
 */
export function CodePanel({ botData, projectName, onClose }: CodePanelProps) {
  // Состояние для управления форматом и отображением кода
  const [selectedFormat, setSelectedFormat] = useState<CodeFormat>('python');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [areAllCollapsed, setAreAllCollapsed] = useState(true);
  const [showFullCode, setShowFullCode] = useState(false);
  
  // Ссылка на редактор Monaco для управления сворачиванием
  const editorRef = useRef<any>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  /**
   * Загрузка списка групп для включения в генерацию кода
   */
  const { data: groups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups'],
  });

  /**
   * Использование хука генератора кода для всех форматов
   */
  const { codeContent, isLoading, loadContent } = useCodeGenerator(botData, projectName, groups);

  /**
   * Определение и отслеживание темы приложения
   * Автоматически переключает тему редактора при изменении темы приложения
   */
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

  /**
   * Загрузка контента при изменении выбранного формата
   */
  useEffect(() => {
    loadContent(selectedFormat);
  }, [selectedFormat, loadContent]);

  /**
   * Функция для сворачивания/разворачивания всех блоков кода в редакторе
   * Переключает состояние всех функций и классов между свернутым и развернутым
   */
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

  /**
   * Копирование кода в буфер обмена
   * Использует Clipboard API для копирования текущего содержимого
   */
  const copyToClipboard = () => {
    navigator.clipboard.writeText(getCurrentContent());
    toast({
      title: "Скопировано!",
      description: "Код скопирован в буфер обмена",
    });
  };

  /**
   * Скачивание файла с кодом
   * Создает и автоматически скачивает файл с соответствующим расширением
   */
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
      python: 'bot',
      json: 'bot_data',
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
      title: "Файл скачан",
      description: `Файл ${link.download} успешно загружен`,
    });
  };

  /**
   * Получение текущего содержимого кода для выбранного формата
   * @returns Строка с кодом или пустая строка если контент не загружен
   */
  const getCurrentContent = () => codeContent[selectedFormat] || '';

  const content = getCurrentContent();
  const lines = content.split('\n');
  const lineCount = lines.length;
  const MAX_VISIBLE_LINES = 1000;
  
  /**
   * Отображаемый контент с учетом ограничения по количеству строк
   * Обрезает код если он слишком длинный для улучшения производительности
   */
  const displayContent = useMemo(() => {
    if (!showFullCode && lines.length > MAX_VISIBLE_LINES) {
      return lines.slice(0, MAX_VISIBLE_LINES).join('\n');
    }
    return content;
  }, [content, showFullCode]);

  /**
   * Статистика кода для отображения информации о структуре
   * Подсчитывает функции, классы, комментарии и другие метрики
   */
  const codeStats = useMemo(() => {
    return {
      totalLines: lineCount,
      truncated: !showFullCode && lineCount > 1000,
      functions: (content.match(/^def |^async def /gm) || []).length,
      classes: (content.match(/^class /gm) || []).length,
      comments: (content.match(/^[^#]*#/gm) || []).length
    };
  }, [content, showFullCode]);

  /**
   * Получение CSS классов иконки для формата файла
   * @param format - Формат кода
   * @returns CSS классы для иконки
   */
  const getFormatIcon = (format: CodeFormat): string => {
    const icons: Record<CodeFormat, string> = {
      python: 'fab fa-python text-blue-500',
      json: 'fas fa-database text-green-500',
      requirements: 'fas fa-list text-orange-500',
      readme: 'fas fa-file-alt text-purple-500',
      dockerfile: 'fab fa-docker text-cyan-500',
      config: 'fas fa-cog text-yellow-500'
    };
    return icons[format];
  };

  /**
   * Получение человекочитаемого названия для формата файла
   * @param format - Формат кода
   * @returns Локализованное название формата
   */
  const getFormatLabel = (format: CodeFormat): string => {
    const labels: Record<CodeFormat, string> = {
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
      <div className="p-2.5 xs:p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
          {/* Header Section */}
          <div className="space-y-1.5 xs:space-y-2">
            <div className="flex items-start justify-between gap-2 xs:gap-2.5 sm:gap-3">
              <div className="flex items-start gap-2 xs:gap-2.5 sm:gap-3">
                <div className="w-7 xs:w-8 sm:w-9 h-7 xs:h-8 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40">
                  <i className="fas fa-code text-purple-600 dark:text-purple-400 text-xs xs:text-sm"></i>
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground leading-tight">Код проекта</h1>
                  <p className="text-xs xs:text-sm text-muted-foreground mt-0.5 xs:mt-1 break-words">Просмотр и загрузка сгенерированного кода</p>
                </div>
              </div>
              {onClose && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="h-8 w-8 flex-shrink-0" 
                  onClick={onClose}
                  title="Закрыть панель кода"
                  data-testid="button-close-code-panel"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Format & Actions Card */}
          <Card className="border border-border/50 shadow-sm">
            <CardHeader className="pb-3 xs:pb-4 sm:pb-5">
              <div className="flex items-start gap-2 xs:gap-2.5 justify-between min-w-0">
                <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
                  <div className="w-6 xs:w-7 h-6 xs:h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-muted/50">
                    <i className={`${getFormatIcon(selectedFormat)} text-xs xs:text-sm`}></i>
                  </div>
                  <div className="min-w-0">
                    <CardTitle className="text-sm xs:text-base font-semibold truncate">{getFormatLabel(selectedFormat)}</CardTitle>
                    <CardDescription className="text-xs xs:text-sm mt-0.5">Выберите формат</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 xs:space-y-3.5 sm:space-y-4">
              {/* Format Selection */}
              <div className="space-y-1.5 xs:space-y-2">
                <label className="text-xs xs:text-sm font-semibold text-foreground block">Форматы:</label>
                <Tabs value={selectedFormat} onValueChange={(value) => setSelectedFormat(value as CodeFormat)} className="w-full">
                  <TabsList className="flex flex-col h-auto p-1 bg-muted/50 min-h-[200px]">
                    <TabsTrigger 
                      value="python" 
                      className="h-9 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:bg-muted/50 flex items-center justify-start pl-2 pr-3"
                    >
                      <i className="fab fa-python mr-2 text-blue-500"></i>
                      Python (.py)
                    </TabsTrigger>
                    <TabsTrigger 
                      value="json" 
                      className="h-9 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:bg-muted/50 flex items-center justify-start pl-2 pr-3"
                    >
                      <i className="fas fa-database mr-2 text-green-500"></i>
                      JSON (.json)
                    </TabsTrigger>
                    <TabsTrigger 
                      value="requirements" 
                      className="h-9 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:bg-muted/50 flex items-center justify-start pl-2 pr-3"
                    >
                      <i className="fas fa-list mr-2 text-orange-500"></i>
                      Requirements (.txt)
                    </TabsTrigger>
                    <TabsTrigger 
                      value="readme" 
                      className="h-9 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:bg-muted/50 flex items-center justify-start pl-2 pr-3"
                    >
                      <i className="fas fa-file-alt mr-2 text-purple-500"></i>
                      README (.md)
                    </TabsTrigger>
                    <TabsTrigger 
                      value="dockerfile" 
                      className="h-9 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:bg-muted/50 flex items-center justify-start pl-2 pr-3"
                    >
                      <i className="fab fa-docker mr-2 text-cyan-500"></i>
                      Dockerfile
                    </TabsTrigger>
                    <TabsTrigger 
                      value="config" 
                      className="h-9 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground hover:data-[state=inactive]:bg-muted/50 flex items-center justify-start pl-2 pr-3"
                    >
                      <i className="fas fa-cog mr-2 text-yellow-500"></i>
                      Config (.yaml)
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 xs:gap-2.5">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  size="sm"
                  className="w-full h-9 xs:h-10 text-xs xs:text-sm"
                  data-testid="button-copy-code"
                >
                  <i className="fas fa-copy text-xs xs:text-sm"></i>
                  <span className="hidden xs:inline ml-1.5">Копировать</span>
                </Button>
                <Button
                  onClick={downloadFile}
                  size="sm"
                  className="w-full h-9 xs:h-10 text-xs xs:text-sm"
                  data-testid="button-download-code"
                >
                  <i className="fas fa-download text-xs xs:text-sm"></i>
                  <span className="hidden xs:inline ml-1.5">Скачать</span>
                </Button>
              </div>

              {/* Code Statistics */}
              {lineCount > 0 && (
                <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-4 gap-2 xs:gap-2.5">
                  <div className="bg-blue-50/50 dark:bg-blue-900/25 border border-blue-200/50 dark:border-blue-800/50 rounded-md p-2 xs:p-2.5 text-center">
                    <div className="text-sm xs:text-base font-bold text-blue-600 dark:text-blue-400">{codeStats.totalLines}</div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">Строк</div>
                  </div>
                  {selectedFormat === 'python' && codeStats.functions > 0 && (
                    <div className="bg-green-50/50 dark:bg-green-900/25 border border-green-200/50 dark:border-green-800/50 rounded-md p-2 xs:p-2.5 text-center">
                      <div className="text-sm xs:text-base font-bold text-green-600 dark:text-green-400">{codeStats.functions}</div>
                      <div className="text-xs text-green-700 dark:text-green-300 mt-0.5">Функции</div>
                    </div>
                  )}
                  {selectedFormat === 'python' && codeStats.classes > 0 && (
                    <div className="bg-purple-50/50 dark:bg-purple-900/25 border border-purple-200/50 dark:border-purple-800/50 rounded-md p-2 xs:p-2.5 text-center">
                      <div className="text-sm xs:text-base font-bold text-purple-600 dark:text-purple-400">{codeStats.classes}</div>
                      <div className="text-xs text-purple-700 dark:text-purple-300 mt-0.5">Классы</div>
                    </div>
                  )}
                  {selectedFormat === 'json' && (
                    <div className="bg-cyan-50/50 dark:bg-cyan-900/25 border border-cyan-200/50 dark:border-cyan-800/50 rounded-md p-2 xs:p-2.5 text-center">
                      <div className="text-sm xs:text-base font-bold text-cyan-600 dark:text-cyan-400">{(content.match(/"/g) || []).length / 2}</div>
                      <div className="text-xs text-cyan-700 dark:text-cyan-300 mt-0.5">Ключей</div>
                    </div>
                  )}
                </div>
              )}

              <Separator className="my-2 xs:my-3" />

              {/* Code Info & Controls */}
              {codeStats.totalLines > 0 && (
                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 xs:gap-3 text-xs xs:text-sm">
                  <div className="flex items-center gap-1.5 xs:gap-2 flex-wrap">
                    <span className="text-muted-foreground whitespace-nowrap">Размер: {Math.round(content.length / 1024)} KB</span>
                    {(selectedFormat === 'python' || selectedFormat === 'json') && (
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={toggleAllFunctions}
                        className="h-7 xs:h-8 px-1.5 xs:px-2 text-xs"
                        data-testid="button-toggle-all-functions"
                      >
                        <i className={`fas ${areAllCollapsed ? 'fa-expand' : 'fa-compress'} text-xs`}></i>
                        <span className="hidden xs:inline ml-1">{areAllCollapsed ? 'Развернуть' : 'Свернуть'}</span>
                      </Button>
                    )}
                  </div>
                  {codeStats.truncated && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowFullCode(true)}
                      className="h-7 xs:h-8 px-2 text-xs xs:text-sm whitespace-nowrap"
                      data-testid="button-show-full-code"
                    >
                      Показать всё ({codeStats.totalLines})
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Code Editor */}
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <CardContent className={`p-0 ${isMobile ? 'h-40 xs:h-48 sm:h-64' : 'h-64 xs:h-80 sm:h-96 md:h-[500px]'}`}>
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
