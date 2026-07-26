/**
 * @fileoverview Панель деталей строки лога терминала
 *
 * Открывается при клике на строку. Показывает полную информацию:
 * дату/время, тип, содержимое и атрибуты строки.
 *
 * @module TerminalLogDetail
 */

import { ChevronUp, ChevronDown, X, Link, FileJson, Eye, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TerminalLine } from './terminalTypes';
import { buildTerminalLogPermalink } from './terminal-log-permalink';
import { useToast } from '@/hooks/use-toast';

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
 * @returns Promise завершения копирования
 */
function copyAsJson(line: TerminalLine): Promise<void> {
  const json = JSON.stringify({
    content: line.content,
    type: line.type,
    timestamp: line.timestamp?.toISOString(),
  }, null, 2);
  return navigator.clipboard.writeText(json);
}

/**
 * Копирует постоянную ссылку на лог в буфер обмена
 * @param line - Строка лога
 * @param tokenId - ID токена бота
 * @returns Promise завершения копирования
 */
function copyPermalink(line: TerminalLine, tokenId: number): Promise<void> {
  return navigator.clipboard.writeText(buildTerminalLogPermalink(line.id, tokenId));
}

/**
 * Панель деталей строки лога (справа от вывода терминала)
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function TerminalLogDetail({ line, tokenId, onClose, onPrev, onNext, onScrollToLine }: TerminalLogDetailProps) {
  const { toast } = useToast();

  if (!line) return null;

  return (
    <div className="w-[380px] shrink-0 h-full bg-card border-l border-border flex flex-col overflow-hidden font-sans">
      {/* Заголовок и сгруппированные действия */}
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border bg-muted/20 px-3">
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          Детали лога
        </span>
        <div className="flex shrink-0 items-center divide-x divide-border/60 overflow-hidden rounded-md border border-border/60 bg-background">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={onPrev} title="Предыдущая строка">
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-none" onClick={onNext} title="Следующая строка">
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" title="Действия">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem
              onClick={() => {
                onScrollToLine();
                toast({ title: 'Строка показана в контексте' });
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Показать в контексте
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                try {
                  await copyAsJson(line);
                  toast({ title: 'JSON скопирован' });
                } catch {
                  toast({ title: 'Не удалось скопировать JSON', variant: 'destructive' });
                }
              }}
            >
              <FileJson className="mr-2 h-4 w-4" />
              Скопировать JSON
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!tokenId}
              onClick={async () => {
                if (!tokenId) return;
                try {
                  await copyPermalink(line, tokenId);
                  toast({ title: 'Ссылка на лог скопирована' });
                } catch {
                  toast({ title: 'Не удалось скопировать ссылку', variant: 'destructive' });
                }
              }}
            >
              <Link className="mr-2 h-4 w-4" />
              Скопировать ссылку
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          title="Закрыть"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Содержимое */}
      <div className="px-4 py-3 border-b border-border flex-1 min-h-0 overflow-auto">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Сообщение
          </span>
          <span className="h-px flex-1 bg-border/60" />
        </div>
        <pre className="text-sm font-mono whitespace-pre-wrap break-all">{line.content}</pre>
      </div>

      {/* Атрибуты */}
      <div className="px-4 py-3 shrink-0">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
            Метаданные
          </span>
          <span className="h-px flex-1 bg-border/60" />
        </div>
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
              <td className="py-1.5 text-left text-xs tabular-nums text-foreground">
                {formatFullDate(line.timestamp)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
