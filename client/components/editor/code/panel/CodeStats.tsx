/**
 * @fileoverview Компактная статистика выбранного файла и управление сворачиванием кода.
 */
import { Button } from '@/components/ui/button';
import type { CodeFormat } from '../hooks/use-code-generator';

/** Свойства статистики выбранного файла. */
interface CodeStatsProps {
  /** Содержимое файла. */
  content: string;
  /** Формат файла. */
  selectedFormat: CodeFormat;
  /** Выполняется ли генерация. */
  isLoading: boolean;
  /** Свёрнуты ли блоки кода. */
  collapseState: boolean;
  /** Обработчик переключения сворачивания. */
  onToggleCollapse: () => void;
  /** Обработчик показа полного кода. */
  onShowFullCode?: () => void;
}

/**
 * Отображает состояние генерации, размер и краткую статистику без отдельных карточек.
 * @param props - Содержимое файла, состояние генерации и управление редактором.
 * @returns Состояние файла и доступное действие сворачивания.
 */
export function CodeStats({ content, selectedFormat, isLoading, collapseState, onToggleCollapse }: CodeStatsProps) {
  if (isLoading) return <div role="status" className="code-inset rounded-lg p-4 text-sm text-muted-foreground">Генерация файла…</div>;
  if (!content.trim()) return <p className="text-pretty text-sm text-muted-foreground">Выберите файл, чтобы загрузить его содержимое.</p>;
  if (content.startsWith('# Ошибка')) return <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Не удалось сгенерировать файл. Проверьте структуру бота.</p>;
  const lines = content.split(/\r?\n/).length;
  const functions = selectedFormat === 'python' ? (content.match(/^def |^async def /gm) || []).length : 0;
  const classes = selectedFormat === 'python' ? (content.match(/^class /gm) || []).length : 0;
  const size = new TextEncoder().encode(content).length / 1024;
  return (
    <div className="space-y-3">
      <dl aria-label="Статистика файла" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <div className="flex gap-1"><dt>Строк:</dt><dd className="font-medium text-foreground">{lines}</dd></div>
        <div className="flex gap-1"><dt>Размер:</dt><dd className="font-medium text-foreground">{size.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} КБ</dd></div>
        {functions > 0 && <div className="flex gap-1"><dt>Функций:</dt><dd className="font-medium text-foreground">{functions}</dd></div>}
        {classes > 0 && <div className="flex gap-1"><dt>Классов:</dt><dd className="font-medium text-foreground">{classes}</dd></div>}
      </dl>
      {(selectedFormat === 'python' || selectedFormat === 'json') && (
        <Button size="sm" variant="ghost" onClick={onToggleCollapse} className="code-action px-3 text-xs" data-testid="button-toggle-all-functions">
          {collapseState ? 'Развернуть блоки кода' : 'Свернуть блоки кода'}
        </Button>
      )}
    </div>
  );
}
