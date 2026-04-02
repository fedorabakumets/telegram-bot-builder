/**
 * @fileoverview Основной контейнер панели кода
 * Объединяет все компоненты панели кода и управляет состоянием
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BotData, BotProject } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { useUpdateProjectName } from '@/components/editor/bot/project/use-update-project-name';
import { BotValidation } from '../types/bot-validation';
import { CodePanelHeader } from './CodePanelHeader';
import { CodeFormatTabs } from './CodeFormatTabs';
import { CodeActions } from './CodeActions';
import { CodeStats } from './CodeStats';
import { CodeFormat } from '../hooks/use-code-generator';

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
}: CodePanelProps) {
  const [localSelectedFormat, setLocalSelectedFormat] = useState<CodeFormat>('python');
  const [localAreAllCollapsed, setLocalAreAllCollapsed] = useState(true);
  const [projectNames, setProjectNames] = useState<string[]>(() =>
    botDataArray.map((_, i) => projectName || `Проект ${i + 1}`),
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const updateProjectNameMutation = useUpdateProjectName();

  const selectedFormat = externalSelectedFormat ?? localSelectedFormat;
  const collapseState = areAllCollapsed ?? localAreAllCollapsed;

  const handleFormatChange = (format: CodeFormat) => {
    onFormatChange ? onFormatChange(format) : setLocalSelectedFormat(format);
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
    <div className="h-full bg-background overflow-auto">
      <div className="p-1.5 xs:p-2 sm:p-3">
        <div className="space-y-3 xs:space-y-4 sm:space-y-5 md:space-y-6">
          <CodePanelHeader onClose={onClose} />

          {botDataArray.map((_botData, index) => {
            const content = getCurrentContent(index);
            const currentProjectName = projectNames[index] || projectName || `Проект ${index + 1}`;
            const projectIdSuffix = projectIds?.[index] ? ` (ID: ${projectIds[index]})` : '';
            const safeFileName = currentProjectName.replace(/[^a-zA-Z0-9_-]/g, '_');

            return (
              <Card key={index} className="border border-border/50 shadow-sm">
                <CardHeader className="pb-3 xs:pb-4 sm:pb-5">
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
                            className="text-sm xs:text-base font-semibold truncate cursor-pointer"
                            onDoubleClick={() => startEditing(index)}
                            title="Двойной клик для переименования"
                          >
                            {currentProjectName}{projectIdSuffix}: {getFormatLabel(selectedFormat)}
                          </CardTitle>
                        )}
                        <CardDescription className="text-xs xs:text-sm mt-0.5">
                          Файлы проекта {currentProjectName}{projectIdSuffix}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 xs:space-y-3.5 sm:space-y-4">
                  <BotValidation botData={botDataArray[index]} />
                  <CodeFormatTabs selectedFormat={selectedFormat} projectName={currentProjectName} onFormatChange={handleFormatChange} />
                  <CodeActions content={content} selectedFormat={selectedFormat} fileName={safeFileName} />
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
