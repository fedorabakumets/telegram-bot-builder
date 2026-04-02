/**
 * @fileoverview Заголовок панели кода
 * Содержит иконку, заголовок, описание, горячие клавиши и кнопку закрытия
 */

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

/**
 * Свойства заголовка панели кода
 */
interface CodePanelHeaderProps {
  /** Колбэк для закрытия панели */
  onClose?: () => void;
}

/**
 * Компонент заголовка панели кода
 * @param props - Свойства компонента
 * @returns JSX элемент заголовка
 */
export function CodePanelHeader({ onClose }: CodePanelHeaderProps) {
  return (
    <div className="space-y-1.5 xs:space-y-2">
      <div className="flex items-start justify-between gap-2 xs:gap-2.5 sm:gap-3">
        <div className="flex items-start gap-2 xs:gap-2.5 sm:gap-3">
          <div className="w-7 xs:w-8 sm:w-9 h-7 xs:h-8 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/40 dark:to-blue-900/40">
            <i className="fas fa-code text-purple-600 dark:text-purple-400 text-xs xs:text-sm"></i>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg xs:text-xl sm:text-2xl font-bold text-foreground leading-tight">Код проекта</h1>
            <p className="text-xs xs:text-sm text-muted-foreground mt-0.5 xs:mt-1 break-words">
              Просмотр и загрузка сгенерированного кода
            </p>
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

      <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/50 rounded-lg p-3 text-xs text-blue-800 dark:text-blue-200">
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
