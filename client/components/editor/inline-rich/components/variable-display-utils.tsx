/**
 * @fileoverview Утилиты для отображения переменных
 * Переиспользуемые функции для VariableSelector и VariablesMenu
 * @module variable-display-utils
 */

import { Image, Video, Music, FileText } from 'lucide-react';
import type { Variable } from '../types';

/**
 * Получает иконку для медиа-переменной
 * @param mediaType - Тип медиа
 * @returns React компонент иконки или null
 */
export function getMediaIcon(mediaType?: string) {
  switch (mediaType) {
    case 'photo': return <Image className="h-4 w-4 text-blue-500" />;
    case 'video': return <Video className="h-4 w-4 text-purple-500" />;
    case 'audio': return <Music className="h-4 w-4 text-green-500" />;
    case 'document': return <FileText className="h-4 w-4 text-orange-500" />;
    default: return null;
  }
}

/**
 * Получает текст бейджа для переменной
 * @param variable - Переменная
 * @returns Текст бейджа
 */
export function getBadgeText(variable: Variable): string {
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
  return labels[variable.nodeType] || '📌';
}

/**
 * Получает информацию об узле или таблице
 * @param variable - Переменная
 * @returns React компонент с информацией
 */
export function getNodeInfo(variable: Variable) {
  // Для системных переменных показываем таблицу
  if (variable.nodeType === 'system' && variable.sourceTable) {
    return (
      <div className="text-[10px] text-teal-600 dark:text-teal-400 font-mono mt-0.5">
        🗄️ {variable.sourceTable}
      </div>
    );
  }
  // Для пользовательских переменных (включая conditional) показываем таблицу bot_users
  if (variable.nodeType === 'user-input' || variable.nodeType === 'conditional') {
    // Если есть несколько узлов, показываем количество
    const nodeIds = (variable as any).nodeIds as string[] | undefined;
    if (nodeIds && nodeIds.length > 1) {
      return (
        <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono mt-0.5 truncate">
          🗄️ bot_users ({nodeIds.length} узла)
        </div>
      );
    }
    return (
      <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono mt-0.5 truncate">
        🗄️ bot_users
      </div>
    );
  }
  // Для команд показываем иконку и короткий ID
  const icons: Record<string, string> = {
    start: '▶️',
    command: '🔧'
  };
  const icon = icons[variable.nodeType] || '📌';
  return (
    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono mt-0.5 truncate">
      {icon} {variable.nodeId.slice(0, 8)}
    </div>
  );
}
