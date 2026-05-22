/**
 * @fileoverview Заголовок панели кода
 * Использует общий TabHeader для единообразия с другими вкладками.
 * Содержит кнопку закрытия и блок горячих клавиш.
 */

import { Code2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TabHeader } from '@/components/ui/tab-header';
import { ProjectSelector } from '@/components/editor/database/user-database/components/header/project-selector';

/**
 * Свойства заголовка панели кода
 */
interface CodePanelHeaderProps {
  /** Колбэк для закрытия панели */
  onClose?: () => void;
  /** Список всех проектов для переключателя */
  allProjects?: Array<{ id: number; name: string }>;
  /** ID текущего проекта */
  currentProjectId?: number;
  /** Обработчик смены проекта */
  onProjectChange?: (projectId: number) => void;
}

/**
 * Компонент заголовка панели кода
 * @param props - Свойства компонента
 * @returns JSX элемент заголовка
 */
export function CodePanelHeader({ onClose, allProjects, currentProjectId, onProjectChange }: CodePanelHeaderProps) {
  return (
    <div className="space-y-2">
      <TabHeader
        icon={<Code2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />}
        title="Код проекта"
        actions={
          onClose ? (
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
          ) : undefined
        }
      >
        {allProjects && allProjects.length > 1 && onProjectChange && currentProjectId && (
          <ProjectSelector
            projects={allProjects}
            selectedProjectId={currentProjectId}
            onSelect={onProjectChange}
          />
        )}
      </TabHeader>

      <div className="mx-4 sm:mx-6 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200">
        <h3 className="font-semibold mb-1">Горячие клавиши:</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          <div><strong>Ctrl+Alt+C / Cmd+Alt+C:</strong> Копировать код</div>
          <div><strong>Ctrl+Alt+F / Cmd+Alt+F:</strong> Переключить сворачивание</div>
          <div><strong>Ctrl+Shift+[</strong>: Сворачивание блока</div>
          <div><strong>Ctrl+Shift+]</strong>: Разворачивание блока</div>
          <div><strong>Ctrl + K, затем Ctrl + J</strong>: Развернуть всё</div>
          <div><strong>Ctrl + F</strong>: Поиск</div>
        </div>
      </div>
    </div>
  );
}
