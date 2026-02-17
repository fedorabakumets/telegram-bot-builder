import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SyncFromFileButton } from './sync-from-file-button';
import { TokenInfo } from './token-info';
import { useToast } from '@/hooks/use-toast';
import { BotData, BotGroup } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { CodeFormat, useCodeGenerator } from '@/hooks/use-code-generator';
import { useUpdateProjectName } from '@/hooks/use-update-project-name';

/**
 * Свойства компонента панели кода
 * @interface CodePanelProps
 */
interface CodePanelProps {
  /** Массив данных ботов для генерации кода */
  botDataArray: BotData[];
  /** Массив ID проектов */
  projectIds?: number[];
  /** Название проекта */
  projectName: string;
  /** Колбэк для закрытия панели */
  onClose?: () => void;
  /** Выбранный формат кода */
  selectedFormat?: CodeFormat;
  /** Функция для изменения выбранного формата */
  onFormatChange?: (format: CodeFormat) => void;
  /** Текущее состояние свернутости */
  areAllCollapsed?: boolean;
  /** Функция для изменения состояния свернутости */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Текущее состояние отображения полного кода */
  showFullCode?: boolean;
  /** Функция для изменения состояния отображения полного кода */
  onShowFullCodeChange?: (showFull: boolean) => void;
  /** Функция для обновления данных ботов */
  onBotDataUpdate?: (updatedBotDataArray: BotData[], index: number, newName: string) => void;
}

/**
 * [CONTAINER] CodePanel - Основной контейнер для панели кода
 * Управляет состоянием и данными для дочерних компонентов
 */
export function CodePanel({ botDataArray, projectIds, projectName, onClose, selectedFormat: externalSelectedFormat, onFormatChange, areAllCollapsed, onCollapseChange, showFullCode, onShowFullCodeChange, onBotDataUpdate }: CodePanelProps) {
  // Состояние для управления форматом и отображением кода
  const [localSelectedFormat, setLocalSelectedFormat] = useState<CodeFormat>('python');
  const [localAreAllCollapsed, setLocalAreAllCollapsed] = useState(true);
  
  // Состояние для хранения имен проектов
  const [projectNames, setProjectNames] = useState<string[]>(() => 
    botDataArray.map((_, index) => projectName || `Проект ${index + 1}`)
  );
  
  // Хук для обновления имени проекта
  const updateProjectNameMutation = useUpdateProjectName();

  // Используем внешнее состояние, если оно предоставлено, иначе локальное
  const selectedFormat = externalSelectedFormat !== undefined ? externalSelectedFormat : localSelectedFormat;
  const collapseState = areAllCollapsed !== undefined ? areAllCollapsed : localAreAllCollapsed;

  // Функция для изменения формата
  const handleFormatChange = (format: CodeFormat) => {
    if (onFormatChange) {
      onFormatChange(format);
    } else {
      setLocalSelectedFormat(format);
    }
  };

  // Функция для изменения состояния сворачивания
  const handleCollapseChange = (collapsed: boolean) => {
    if (onCollapseChange) {
      onCollapseChange(collapsed);
    } else {
      setLocalAreAllCollapsed(collapsed);
    }
  };

  const { toast } = useToast();

  /**
   * Загрузка списка групп для включения в генерацию кода
   */
  const { data: groups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups'],
  });

  /**
   * Использование хука генератора кода для всех форматов
   */
  const codeGenerators = botDataArray.map((botData, index) => useCodeGenerator(botData, `${projectName}_project_${index}`, groups));

  /**
   * Загрузка контента при изменении выбранного формата
   */
  useEffect(() => {
    codeGenerators.forEach(({ loadContent }) => {
      loadContent(selectedFormat);
    });
  }, [selectedFormat, codeGenerators]);

  // [FUNCTIONS] Вспомогательные функции для взаимодействия с кодом

  // [FUNCTIONS] Функции для взаимодействия с кодом (относятся к верхней части)

  /**
   * Функция для сворачивания/разворачивания всех блоков кода в редакторе
   * Переключает состояние всех функций и классов между свернутым и развернутым
   */
  const toggleAllFunctions = (_index: number) => {
    handleCollapseChange(!collapseState);
  };

  /**
   * Копирование кода в буфер обмена
   * Использует Clipboard API для копирования текущего содержимого
   */
  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Скопировано!",
      description: "Код скопирован в буфер обмена",
    });
  };

  /**
   * Скачивание файла с кодом
   * Создает и автоматически скачивает файл с соответствующим расширением
   */
  const downloadFile = async (content: string, projectIndex: number) => {
    const fileExtensions: Record<CodeFormat, string> = {
      python: '.py',
      json: '.json',
      requirements: '.txt',
      readme: '.md',
      dockerfile: '',
      config: '.yaml'
    };

    const fileNames: Record<CodeFormat, string> = {
      python: `bot_project_${projectIndex}`,
      json: `bot_data_project_${projectIndex}`,
      requirements: `requirements_project_${projectIndex}`,
      readme: `README_project_${projectIndex}`,
      dockerfile: `Dockerfile_project_${projectIndex}`,
      config: `config_project_${projectIndex}`
    };

    const blob = new Blob([content], { type: 'text/plain' });
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
  const getCurrentContent = (index: number) => codeGenerators[index].codeContent[selectedFormat] || '';

  // [CALCULATIONS] Расчеты для отображения кода и статистики

  const getContentAndStats = (index: number) => {
    const content = getCurrentContent(index);
    const lines = content.split('\n');
    const lineCount = lines.length;

    const codeStats = {
      totalLines: lineCount,
      truncated: !(showFullCode !== undefined ? showFullCode : false) && lineCount > 1000,
      functions: (content.match(/^def |^async def /gm) || []).length,
      classes: (content.match(/^class /gm) || []).length,
      comments: (content.match(/^[^#]*#/gm) || []).length
    };

    return { content, lineCount, codeStats };
  };

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

          {/* [COMPONENT] CodePanelHeader - Верхняя часть с вкладками и действиями */}
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

            {/* Hotkeys Info */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200">
              <h3 className="font-semibold mb-1">Горячие клавиши:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                <div><strong>Ctrl+Alt+C / Cmd+Alt+C:</strong> Копировать код</div>
                <div><strong>Ctrl+Alt+F / Cmd+Alt+F:</strong> Переключить сворачивание</div>
                <div><strong>Ctrl+Shift+[</strong>: Сворачивание блока</div>
                <div><strong>Ctrl+Shift+]</strong>: Разворачивание блока</div>
                <div><strong>Ctrl + K, затем Ctrl + 0</strong>: Свернуть всё</div>
                <div><strong>Ctrl + K, затем Ctrl + J</strong>: Развернуть всё</div>
                <div><strong>Ctrl + F</strong>: Поиск</div>
                <div><strong>Ctrl + G</strong>: Перейти к строке</div>
              </div>
            </div>

            {/* Sync Button */}
            <div className="flex justify-end">
              <SyncFromFileButton onSyncComplete={() => {}} />
            </div>
          </div>

          {/* Render each project separately */}
          {botDataArray.map((_botData, index) => {
            const { content, lineCount, codeStats } = getContentAndStats(index);
            
            // Используем локальное состояние для имени проекта
            const currentProjectName = projectNames[index] || projectName || `Проект ${index + 1}`;
            
            // Получаем ID проекта, если доступен
            const projectIdSuffix = projectIds && projectIds[index] ? ` (ID: ${projectIds[index]})` : '';
            
            return (
              <Card key={index} className="border border-border/50 shadow-sm">
                <CardHeader className="pb-3 xs:pb-4 sm:pb-5">
                  <div className="flex items-start gap-2 xs:gap-2.5 justify-between min-w-0">
                    <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
                      <div className="w-6 xs:w-7 h-6 xs:h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-muted/50">
                        <i className={`${getFormatIcon(selectedFormat)} text-xs xs:text-sm`}></i>
                      </div>
                      <div className="min-w-0">
                        <CardTitle 
                          className="text-sm xs:text-base font-semibold truncate cursor-pointer"
                          onDoubleClick={() => {
                            const newName = prompt('Введите новое название файла:', currentProjectName);
                            if (newName !== null && newName.trim() !== '') {
                              // Обновляем имя проекта в локальном состоянии
                              setProjectNames(prevNames => {
                                const updatedNames = [...prevNames];
                                updatedNames[index] = newName.trim();
                                return updatedNames;
                              });
                              
                              // Обновляем имя проекта в базе данных
                              const projectId = projectIds?.[index];
                              if (projectId) {
                                updateProjectNameMutation.mutate({
                                  projectId,
                                  name: newName.trim()
                                });
                              }
                              
                              // Передаем обновленное имя проекта через callback
                              if (onBotDataUpdate) {
                                onBotDataUpdate(botDataArray, index, newName.trim());
                              }
                            }
                          }}
                        >
                          {currentProjectName}{projectIdSuffix}: {getFormatLabel(selectedFormat)}
                        </CardTitle>
                        <CardDescription className="text-xs xs:text-sm mt-0.5">Файлы проекта {currentProjectName}{projectIdSuffix}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 xs:space-y-3.5 sm:space-y-4">
                  {/* Информация о токенах проекта */}
                  {projectIds && projectIds[index] && (
                    <TokenInfo projectId={projectIds[index]} />
                  )}
                  
                  {/* Format Selection */}
                  <div className="space-y-1.5 xs:space-y-2">
                    <label className="text-xs xs:text-sm font-semibold text-foreground block">Форматы:</label>
                    <Tabs value={selectedFormat} onValueChange={(value) => handleFormatChange(value as CodeFormat)} className="w-full">
                      <TabsList className="flex flex-col h-auto p-0 bg-transparent border-none justify-start">
                        <TabsTrigger
                          value="python"
                          className="w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm font-normal rounded-none border-b border-border/50 data-[state=inactive]:hover:bg-accent/20 justify-start"
                        >
                          <i className="fas fa-file-code text-blue-500 text-xs"></i>
                          <span className="text-xs">bot.py</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="json"
                          className="w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm font-normal rounded-none border-b border-border/50 data-[state=inactive]:hover:bg-accent/20 justify-start"
                        >
                          <i className="fas fa-file-code text-green-500 text-xs"></i>
                          <span className="text-xs">bot_data.json</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="requirements"
                          className="w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm font-normal rounded-none border-b border-border/50 data-[state=inactive]:hover:bg-accent/20 justify-start"
                        >
                          <i className="fas fa-file-alt text-orange-500 text-xs"></i>
                          <span className="text-xs">requirements.txt</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="readme"
                          className="w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm font-normal rounded-none border-b border-border/50 data-[state=inactive]:hover:bg-accent/20 justify-start"
                        >
                          <i className="fas fa-file-alt text-purple-500 text-xs"></i>
                          <span className="text-xs">README.md</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="dockerfile"
                          className="w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm font-normal rounded-none border-b border-border/50 data-[state=inactive]:hover:bg-accent/20 justify-start"
                        >
                          <i className="fab fa-docker text-cyan-500 text-xs"></i>
                          <span className="text-xs">Dockerfile</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="config"
                          className="w-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground hover:bg-muted flex items-center gap-2 px-3 py-2 text-sm font-normal rounded-none border-b border-border/50 data-[state=inactive]:hover:bg-accent/20 justify-start"
                        >
                          <i className="fas fa-file-code text-yellow-500 text-xs"></i>
                          <span className="text-xs">config.yaml</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 xs:gap-2.5">
                    <Button
                      onClick={() => copyToClipboard(content)}
                      variant="outline"
                      size="sm"
                      className="w-full h-9 xs:h-10 text-xs xs:text-sm"
                      data-testid="button-copy-code"
                    >
                      <i className="fas fa-copy text-xs xs:text-sm"></i>
                      <span className="hidden xs:inline ml-1.5">Копировать</span>
                    </Button>
                    <Button
                      onClick={() => downloadFile(content, index)}
                      size="sm"
                      className="w-full h-9 xs:h-10 text-xs xs:text-sm"
                      data-testid="button-download-code"
                    >
                      <i className="fas fa-download text-xs xs:text-sm"></i>
                      <span className="hidden xs:inline ml-1.5">Скачать</span>
                    </Button>
                  </div>

                  {/* Export Structure Button */}
                  {selectedFormat === 'json' && projectIds?.[index] && (
                    <Button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const btn = e.currentTarget;
                        const originalText = btn.innerHTML;
                        btn.disabled = true;
                        btn.innerHTML = '<span class="animate-spin">⏳</span> Экспорт...';
                        
                        try {
                          const res = await fetch(`/api/projects/${projectIds[index]}/export-structure-to-google-sheets`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' }
                          });
                          const data = await res.json();
                          
                          if (!res.ok) {
                            if (data.requiresAuth) {
                              const authRes = await fetch('/api/google-auth/start');
                              const authData = await authRes.json();
                              if (authData.authUrl) {
                                const authWindow = window.open(authData.authUrl, '_blank');
                                setTimeout(() => authWindow?.close(), 5000);
                              }
                            } else {
                              alert('Ошибка экспорта: ' + (data.error || data.message));
                            }
                          } else if (data.spreadsheetUrl) {
                            window.open(data.spreadsheetUrl, '_blank');
                          }
                        } catch (err) {
                          console.error('Export error:', err);
                          alert('Ошибка при экспорте структуры');
                        } finally {
                          btn.disabled = false;
                          btn.innerHTML = originalText;
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="w-full h-9 xs:h-10 text-xs xs:text-sm border-2 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/50"
                      data-testid="button-export-structure"
                    >
                      <i className="fas fa-file-export text-xs xs:text-sm"></i>
                      <span className="hidden xs:inline ml-1.5">📊 Экспорт структуры</span>
                    </Button>
                  )}

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
                            onClick={() => toggleAllFunctions(index)}
                            className="h-7 xs:h-8 px-1.5 xs:px-2 text-xs"
                            data-testid="button-toggle-all-functions"
                          >
                            <i className={`fas ${collapseState ? 'fa-expand' : 'fa-compress'} text-xs`}></i>
                            <span className="hidden xs:inline ml-1">{collapseState ? 'Развернуть' : 'Свернуть'}</span>
                          </Button>
                        )}
                      </div>
                      {codeStats.truncated && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onShowFullCodeChange && onShowFullCodeChange(true)}
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
            );
          })}
          {/* [/COMPONENT] CodePanelHeader */}

        </div>
      </div>
    </div>
  );
}


