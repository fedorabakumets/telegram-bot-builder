/**
 * @fileoverview Компонент меню выбора переменных
 * @description Выпадающее меню со списком доступных переменных для вставки
 */

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Plus, Image, Video, Music, FileText } from 'lucide-react';
import type { Variable } from '../types';

/**
 * Свойства компонента VariablesMenu
 */
export interface VariablesMenuProps {
  /** Доступные переменные */
  availableVariables: Variable[];
  /** Функция вставки переменной */
  insertVariable: (name: string) => void;
}

/**
 * Меню выбора переменных для вставки в редактор
 */
export function VariablesMenu({
  availableVariables,
  insertVariable
}: VariablesMenuProps) {
  if (availableVariables.length === 0) return null;

  const getMediaIcon = (mediaType?: string) => {
    switch (mediaType) {
      case 'photo': return <Image className="h-4 w-4 text-blue-500" />;
      case 'video': return <Video className="h-4 w-4 text-purple-500" />;
      case 'audio': return <Music className="h-4 w-4 text-green-500" />;
      case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return null;
    }
  };

  const getBadgeText = (variable: Variable) => {
    if (variable.mediaType) {
      const labels: Record<string, string> = {
        photo: '🖼️ Фото',
        video: '🎥 Видео',
        audio: '🎵 Аудио',
        document: '📄 Документ'
      };
      return labels[variable.mediaType];
    }
    const labels: Record<string, string> = {
      'user-input': '⌨️ Ввод',
      start: '▶️ Команда',
      command: '🔧 Команда',
      system: '⚙️ Система',
      conditional: '❓ Условие'
    };
    return labels[variable.nodeType] || '📌 Другое';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 sm:h-9 px-2.5 sm:px-3 gap-1.5 text-xs sm:text-sm font-medium bg-gradient-to-r from-blue-500/10 to-cyan-500/10 dark:from-blue-600/20 dark:to-cyan-600/15 hover:from-blue-500/20 hover:to-cyan-500/15 dark:hover:from-blue-600/30 dark:hover:to-cyan-600/25 border border-blue-300/40 dark:border-blue-600/40 hover:border-blue-400/60 dark:hover:border-blue-500/60 transition-all"
          title="Вставить переменную"
        >
          <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="hidden sm:inline">Переменная</span>
          <span className="sm:hidden">+ Переменная</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 sm:w-64">
        <DropdownMenuLabel className="text-xs sm:text-sm font-semibold">
          📌 Доступные переменные
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableVariables.map((variable, index) => (
          <DropdownMenuItem
            key={`${variable.nodeId}-${variable.name}-${index}`}
            onClick={() => insertVariable(variable.name)}
            className="cursor-pointer"
          >
            <div className="flex flex-col gap-1.5 w-full">
              <div className="flex items-center gap-2">
                {getMediaIcon(variable.mediaType)}
                <code className="text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {`{${variable.name}}`}
                </code>
                <Badge variant="secondary" className="text-xs h-5 ml-auto">
                  {getBadgeText(variable)}
                </Badge>
              </div>
              {variable.description && (
                <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {variable.description}
                </div>
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
