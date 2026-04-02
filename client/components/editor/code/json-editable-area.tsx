/**
 * @fileoverview Обёртка над CodeEditorArea для редактируемого JSON с кнопкой применения
 * @module components/editor/code/json-editable-area
 */

import { MutableRefObject, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { CodeEditorArea } from './code-editor-area';
import { useToast } from '@/hooks/use-toast';

/** Тип для Monaco Editor (минимальный интерфейс) */
interface MonacoEditor {
  /** Получить текущее значение */
  getValue: () => string;
  /** Установить значение */
  setValue: (value: string) => void;
  /** Получить действие по ID */
  getAction: (action: string) => { run: () => Promise<void> } | null;
  /** Установить фокус */
  focus: () => void;
  /** Получить модель */
  getModel: () => any;
  /** Обновить параметры */
  updateOptions: (options: any) => void;
  /** Уничтожить */
  dispose: () => void;
}

/** Статистика кода */
interface CodeStats {
  /** Общее количество строк */
  totalLines: number;
  /** Флаг обрезки */
  truncated: boolean;
  /** Количество функций */
  functions: number;
  /** Количество классов */
  classes: number;
  /** Количество комментариев */
  comments: number;
}

/**
 * Свойства компонента редактируемой области JSON
 */
interface JsonEditableAreaProps {
  /** Флаг загрузки */
  isLoading: boolean;
  /** Отображаемый контент (для не-JSON форматов) */
  displayContent: string;
  /** Контент JSON (передаётся явно чтобы не зависеть от selectedFormat) */
  jsonContent?: string;
  /** Выбранный формат */
  selectedFormat: string;
  /** Тема редактора */
  theme: string;
  /** Ссылка на Monaco Editor */
  editorRef: MutableRefObject<MonacoEditor | null>;
  /** Статистика кода */
  codeStats: CodeStats;
  /** Сеттер состояния сворачивания */
  setAreAllCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  /** Текущее состояние сворачивания */
  areAllCollapsed?: boolean;
  /** Колбэк применения изменений JSON */
  onJsonApply?: (json: string) => void;
}

/**
 * Область редактора кода с поддержкой редактирования JSON.
 * На вкладке json показывает кнопку "Применить изменения" и включает редактирование.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function JsonEditableArea({
  isLoading,
  displayContent,
  jsonContent = '',
  selectedFormat,
  theme,
  editorRef,
  codeStats,
  setAreAllCollapsed,
  areAllCollapsed,
  onJsonApply,
}: JsonEditableAreaProps) {
  const isJson = selectedFormat === 'json';
  /** Текущее значение редактора (только для json) */
  const [jsonValue, setJsonValue] = useState(jsonContent);
  const { toast } = useToast();

  // Синхронизируем значение редактора при смене проекта или загрузке контента
  useEffect(() => { setJsonValue(jsonContent); }, [jsonContent]);

  /**
   * Применяет изменения JSON — валидирует и вызывает onJsonApply
   */
  const handleApply = () => {
    try {
      JSON.parse(jsonValue);
      onJsonApply?.(jsonValue);
      toast({ title: 'JSON применён', description: 'Изменения сохранены в проект' });
    } catch (err) {
      toast({
        title: 'Невалидный JSON',
        description: err instanceof Error ? err.message : 'Ошибка парсинга',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full flex flex-col gap-2">
      {isJson && onJsonApply && (
        <Button size="sm" className="w-full flex-shrink-0" onClick={handleApply} data-testid="button-apply-json-editor">
          <Save className="h-4 w-4 mr-1.5" />
          Применить изменения
        </Button>
      )}
      <div className="flex-1 min-h-0">
        <CodeEditorArea
          isMobile={false}
          isLoading={isLoading}
          displayContent={isJson ? jsonValue : displayContent}
          selectedFormat={selectedFormat}
          theme={theme}
          editorRef={editorRef}
          codeStats={codeStats}
          setAreAllCollapsed={setAreAllCollapsed}
          areAllCollapsed={areAllCollapsed}
          readOnly={!isJson}
          onChange={isJson ? setJsonValue : undefined}
        />
      </div>
    </div>
  );
}
