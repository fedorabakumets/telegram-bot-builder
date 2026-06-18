/**
 * @fileoverview Панель деталей строки лога терминала
 *
 * Открывается при клике на строку. Показывает полную информацию:
 * дату/время, тип, содержимое и атрибуты строки.
 *
 * @module TerminalLogDetail
 */

import { ChevronUp, ChevronDown, X, Link, FileJson, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TerminalLine } from './terminalTypes';
import { buildTerminalLogPermalink } from './terminal-log-permalink';

/** Свойства компонента панели деталей строки */
export interface TerminalLogDetailProps {
  /** Строка лога для отображения */
  line: TerminalLine | undefined;
  /** ID токена бота (для постоянной ссылки) */
  tokenId?: number;
  /** Закрыть панель */
  onClose: () => void;
  /** Перейти к предыдущей строке */
  onPrev: () => void;
  /** Перейти к следующей строке */
  onNext: () => void;
  /** Прокрутить к строке в контексте */
  onScrollToLine: () => void;
}

/**
 * Форматирует дату: "21 мая 2026, 21:20:31"
 * @param date - Дата для форматирования
 * @returns Отформатированная строка даты
 */
function formatFullDate(date?: Date): string {
  if (!date) return '—';
  const d = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  const t = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  return `${d}, ${t}`;
}

/**
 * Копирует строку лога в буфер обмена как JSON
 * @param line - Строка лога
 */
function copyAsJson(line: TerminalLine) {
  const json = JSON.stringify({
    content: line.content,
    type: line.type,
    timestamp: line.timestamp?.toISOString(),
  }, null, 2);
  navigator.clipboard.writeText(json);
}

/**
 * Копирует постоянную ссылку на лог в буфер обмена
 * @param line - Строка лога
 * @param tokenId - ID токена бота
 */
function copyPermalink(line: TerminalLine, tokenId: number) {
  navigator.clipboard.writeText(buildTerminalLogPermalink(line.id, tokenId));
}

/**
 * Панель деталей строки лога (справа от вывода терминала)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalLogDetail({ line, tokenId, onClose, onPrev, onNext, onScrollToLine }: TerminalLogDetailProps) {
  if (!line) return null;

  const isError = line.type === 'stderr';

  return (
    <div className="w-[380px] shrink-0 h-full bg-card border-l border-border flex flex-col overflow-hidden">
      {/* Заголовок с кнопками */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-border shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onPrev} title="Предыдущая строка">
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onNext} title="Следующая строка">
          <ChevronDown className="h-4 w-4" />
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onScrollToLine} title="Просмотр в контексте">
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => copyAsJson(line)} title="Скопировать журнал в формате JSON">
          <FileJson className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => tokenId && copyPermalink(line, tokenId)}
          disabled={!tokenId}
          title="Скопировать постоянную ссылку"
        >
          <Link className="h-4 w-4" />
        </Button>
        <div className="flex-1" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose} title="Закрыть">
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Дата и тип */}
      <div className="px-4 py-3 border-b border-border shrink-0 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">{formatFullDate(line.timestamp)}</span>
        <Badge
          variant={isError ? 'destructive' : 'default'}
          className={isError ? '' : 'bg-green-600 hover:bg-green-600/80 text-white border-transparent'}
        >
          {isError ? 'Ошибка' : 'Информация'}
        </Badge>
      </div>

      {/* Содержимое */}
      <div className="px-4 py-3 border-b border-border flex-1 min-h-0 overflow-auto">
        <p className="text-xs text-muted-foreground mb-1">Содержимое</p>
        <pre className="text-sm font-mono whitespace-pre-wrap break-all">{line.content}</pre>
      </div>

      {/* Атрибуты */}
      <div className="px-4 py-3 shrink-0">
        <p className="text-xs text-muted-foreground mb-2">Атрибуты</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground border-b border-border">
              <th className="text-left py-1 font-medium">Имя</th>
              <th className="text-left py-1 font-medium">Значение</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border/50">
              <td className="py-1.5 text-muted-foreground">Уровень</td>
              <td className="py-1.5 font-mono">{line.type === 'stderr' ? 'error' : 'info'}</td>
            </tr>
            <tr>
              <td className="py-1.5 text-muted-foreground">Время</td>
              <td className="py-1.5 font-mono text-xs">{line.timestamp?.toISOString() ?? '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
