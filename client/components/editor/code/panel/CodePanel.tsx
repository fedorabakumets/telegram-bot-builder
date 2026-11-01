/**
 * @fileoverview Основной контейнер панели кода
 * Объединяет все компоненты панели кода и управляет состоянием
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceActionButton } from '@/components/ui/workspace-action-button';
import { BotData, BotProject } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { useUpdateProjectName } from '@/components/editor/bot/project/use-update-project-name';
import { BotValidation } from '../types/bot-validation';
import { CodePanelHeader } from './CodePanelHeader';
import { CodeFormatTabs } from './CodeFormatTabs';
import { CodeActions } from './CodeActions';
import { CodeStats } from './CodeStats';
import { JsonApplyBar } from './JsonApplyBar';
import { CodeFormat } from '../hooks/use-code-generator';
import './code-panel.css';
import { useOpenCodeView } from '@/components/layout/flexible/components/code-view-navigation';

/**
 * Свойства компонента панели кода
 */
interface CodePanelProps {
  /** Массив данных ботов */
  botDataArray: BotData[];
  /** Массив ID проектов */
  projectIds?: number[];
  /** Название проекта */
  projectName: string;
  /** Колбэк закрытия панели */
  onClose?: () => void;
  /** Выбранный формат кода */
  selectedFormat?: CodeFormat;
  /** Колбэк смены формата */
  onFormatChange?: (format: CodeFormat) => void;
  /** Состояние сворачивания блоков */
  areAllCollapsed?: boolean;
  /** Колбэк изменения сворачивания */
  onCollapseChange?: (collapsed: boolean) => void;
  /** Состояние отображения полного кода */
  showFullCode?: boolean;
  /** Колбэк изменения отображения полного кода */
  onShowFullCodeChange?: (showFull: boolean) => void;
  /** Колбэк обновления данных ботов */
  onBotDataUpdate?: (updatedBotDataArray: BotData[], index: number, newName: string) => void;
  /** Сгенерированный контент для каждого формата */
  codeContent?: Record<CodeFormat, string>;
  /** Состояние загрузки */
  isLoading?: boolean;
  /** Отображаемый контент (с учётом обрезки) */
  displayContent?: string;
  /** Колбэк применения отредактированного JSON к данным бота */
  onApplyJson?: (jsonString: string, index: number) => void;
  /** Текущий отредактированный контент из Monaco Editor (для отображения isDirty) */
  editedContent?: string;
  /** Колбэк сброса редактора к исходному контенту */
  onResetEditor?: () => void;
}

/**
 * Основной контейнер панели кода
 * @param props - Свойства компонента
 * @returns JSX элемент панели кода
 */
export function CodePanel({
  botDataArray, projectIds, projectName, onClose,
  selectedFormat: externalSelectedFormat, onFormatChange,
  areAllCollapsed, onCollapseChange,
  onShowFullCodeChange, onBotDataUpdate,
  codeContent, isLoading, displayContent,
  onApplyJson, editedContent, onResetEditor,
}: CodePanelProps) {
  const openCodeView = useOpenCodeView();
  const [localSelectedFormat, setLocalSelectedFormat] = useState<CodeFormat>('python');
  const [localAreAllCollapsed, setLocalAreAllCollapsed] = useState(true);
  const [projectNames, setProjectNames] = useState<string[]>(() =>
    botDataArray.map((_, i) => projectName || `Проект ${i + 1}`),
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  /** Текст ошибки валидации JSON */
  const [jsonError, setJsonError] = useState<string | null>(null);

  const updateProjectNameMutation = useUpdateProjectName();

  const selectedFormat = externalSelectedFormat ?? localSelectedFormat;
  const collapseState = areAllCollapsed ?? localAreAllCollapsed;

  // Валидируем JSON при изменении editedContent
  useEffect(() => {
    if (!editedContent || selectedFormat !== 'json') {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(editedContent);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : 'Невалидный JSON');
    }
  }, [editedContent, selectedFormat]);

  /** Выбирает файл и открывает его содержимое в мобильном просмотре кода. */
  const handleFormatChange = (format: CodeFormat) => {
    onFormatChange ? onFormatChange(format) : setLocalSelectedFormat(format);
    setJsonError(null);
    openCodeView?.();
  };

  const handleCollapseChange = (collapsed: boolean) => {
    onCollapseChange ? onCollapseChange(collapsed) : setLocalAreAllCollapsed(collapsed);
  };

  const { data: _project } = useQuery<BotProject>({
    queryKey: [`/api/projects/${projectIds?.[0]}`],
    enabled: !!projectIds?.[0],
    staleTime: 1000 * 60 * 5,
  });

  /**
   * Начинает inline-редактирование имени проекта
   * @param index - Индекс проекта
   */
  const startEditing = (index: number) => {
    setEditingIndex(index);
    setEditingValue(projectNames[index] || projectName || `Проект ${index + 1}`);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  /**
   * Сохраняет новое имя проекта
   * @param index - Индекс проекта
   */
  const commitEdit = (index: number) => {
    const newName = editingValue.trim();
    if (newName && newName !== projectNames[index]) {
      setProjectNames(prev => { const n = [...prev]; n[index] = newName; return n; });
      const projectId = projectIds?.[index];
      if (projectId) updateProjectNameMutation.mutate({ projectId, name: newName });
      if (onBotDataUpdate) onBotDataUpdate(botDataArray, index, newName);
    }
    setEditingIndex(null);
  };

  /**
   * Применяет изменения JSON
   * @param index - Индекс проекта
   */
  const handleApplyJson = (index: number) => {
    if (!editedContent || jsonError) return;
    onApplyJson?.(editedContent, index);
  };

  /** Сбрасывает изменения JSON */
  const handleResetJson = () => {
    setJsonError(null);
    onResetEditor?.();
  };

  /**
   * Получает текущий контент для отображения
   * @param _index - Индекс проекта
   * @returns Строка с кодом
   */
  const getCurrentContent = (_index: number): string => {
    if (displayContent) return displayContent;
    if (codeContent && codeContent[selectedFormat]) return codeContent[selectedFormat];
    return '';
  };

  /**
   * Возвращает CSS класс иконки для формата
   * @param format - Формат кода
   * @returns CSS классы иконки
   */
  const getFormatIcon = (format: CodeFormat): string => ({
    python: 'fab fa-python text-blue-500',
    json: 'fas fa-database text-green-500',
    requirements: 'fas fa-list text-orange-500',
    readme: 'fas fa-file-alt text-purple-500',
    dockerfile: 'fab fa-docker text-cyan-500',
    env: 'fas fa-lock text-red-500',
  }[format]);

  /**
   * Возвращает локализованное название формата
   * @param format - Формат кода
   * @returns Название формата
   */
  const getFormatLabel = (format: CodeFormat): string => ({
    python: 'Python код', json: 'JSON данные', requirements: 'Requirements.txt',
    readme: 'README.md', dockerfile: 'Dockerfile', env: '.env',
  }[format]);

  return (
    <div className="code-panel code-panel-scroll h-full overflow-auto bg-background">
      <div className="code-panel-padding p-4 sm:p-6">
        <div className="code-panel-stack mx-auto max-w-3xl space-y-6">
          <CodePanelHeader />

          {botDataArray.map((_botData, index) => {
            const content = getCurrentContent(index);
            const currentProjectName = projectNames[index] || projectName || `Проект ${index + 1}`;
            const projectIdSuffix = projectIds?.[index] ? ` (ID: ${projectIds[index]})` : '';
            const safeFileName = currentProjectName.replace(/[^a-zA-Z0-9_-]/g, '_');

            return (
              <Card key={index} className="code-surface rounded-2xl border shadow-none">
                <CardHeader className="code-project-header space-y-2 p-4 sm:p-6">
                  <div className="flex items-start gap-2 xs:gap-2.5 justify-between min-w-0">
                    <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
                      <div className="w-6 xs:w-7 h-6 xs:h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-muted/50">
                        <i className={`${getFormatIcon(selectedFormat)} text-xs xs:text-sm`}></i>
                      </div>
                      <div className="min-w-0">
                        {editingIndex === index ? (
                          <input
                            ref={inputRef}
                            className="text-sm xs:text-base font-semibold bg-transparent border-b border-primary outline-none w-full"
                            value={editingValue}
                            onChange={e => setEditingValue(e.target.value)}
                            onBlur={() => commitEdit(index)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') commitEdit(index);
                              if (e.key === 'Escape') setEditingIndex(null);
                            }}
                          />
                        ) : (
                          <CardTitle
                            className="code-project-title cursor-pointer break-words text-base font-semibold"
                            onDoubleClick={() => startEditing(index)}
                            title={`${currentProjectName}. Двойной клик для переименования`}
                          >
                            {currentProjectName}
                          </CardTitle>
                        )}
                        <CardDescription className="mt-1 text-xs">
                          {getFormatLabel(selectedFormat)}{projectIdSuffix ? ` · Проект ${projectIds?.[index]}` : ''}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="code-project-content space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                  <BotValidation botData={botDataArray[index]} />
                  {openCodeView && <WorkspaceActionButton onClick={openCodeView} className="code-action w-full px-3 text-base font-semibold">
                    Открыть код <span aria-hidden="true">→</span>
                  </WorkspaceActionButton>}
                  <CodeActions content={content} selectedFormat={selectedFormat} fileName={safeFileName} isLoading={isLoading} />
                  <CodeFormatTabs selectedFormat={selectedFormat} projectName={currentProjectName} onFormatChange={handleFormatChange} />
                  {selectedFormat === 'json' && !editedContent && (
                    <div className="flex items-start gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border/40">
                      <i className="fas fa-info-circle text-xs text-muted-foreground/60 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Здесь хранится структура сценария бота. Отредактируйте JSON в редакторе справа и нажмите{' '}
                        <span className="font-medium text-foreground/80">«Применить»</span> — изменения вступят в силу.
                      </p>
                    </div>
                  )}
                  {selectedFormat === 'json' && (
                    <JsonApplyBar
                      isDirty={!!editedContent && editedContent !== content}
                      error={jsonError}
                      onApply={() => handleApplyJson(index)}
                      onReset={handleResetJson}
                    />
                  )}
                  <CodeStats
                    content={content}
                    selectedFormat={selectedFormat}
                    isLoading={!!isLoading}
                    collapseState={collapseState}
                    onToggleCollapse={() => handleCollapseChange(!collapseState)}
                    onShowFullCode={onShowFullCodeChange ? () => onShowFullCodeChange(true) : undefined}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
