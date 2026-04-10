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
    conditional: '❓ Условие',
    callback_trigger: '👆 Инлайн-триггер',
    managed_bot_updated_trigger: '🤖 Управляемый бот',
    get_managed_bot_token: '🔑 Токен бота',
    message_id: '🆔 ID сообщения',
    http_request: '🌐 HTTP',
    input: '⌨️ Ввод',
  };
  return labels[variable.nodeType] || '📌';
}

/**
 * Получает информацию об узле или таблице
 * @param variable - Переменная
 * @returns React компонент с информацией
 */
export function getNodeInfo(variable: Variable) {
  // Для callback_trigger показываем описание триггера
  if (variable.nodeType === 'callback_trigger') {
    return (
      <div className="text-[10px] text-orange-500 dark:text-orange-400 font-mono mt-0.5 truncate">
        👆 {variable.description || variable.nodeId.slice(0, 8)}
      </div>
    );
  }
  // Для системных переменных показываем таблицу или описание
  if (variable.nodeType === 'system') {
    if (variable.sourceTable) {
      // Обрезаем описание до скобки с именем таблицы если оно есть
      const desc = variable.description
        ? variable.description.replace(/\s*\([^)]+\)\s*$/, '')
        : null;
      return (
        <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 truncate">
          {desc || <span className="font-mono">🗄️ {variable.sourceTable}</span>}
        </div>
      );
    }
    if (variable.description) {
      return (
        <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 truncate">
          {variable.description}
        </div>
      );
    }
    return (
      <div className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5">
        ⚙️ Системная переменная
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
  // Для get_managed_bot_token показываем описание переменной
  if ((variable.nodeType as string) === 'get_managed_bot_token') {
    return (
      <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5 truncate">
        🔑 {variable.description}
      </div>
    );
  }
  // Для managed_bot_updated_trigger показываем описание переменной
  if ((variable.nodeType as string) === 'managed_bot_updated_trigger') {
    return (
      <div className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-0.5 truncate">
        🤖 {variable.description}
      </div>
    );
  }
  // Для message_id показываем описание ID сообщения
  if ((variable.nodeType as string) === 'message_id') {
    return (
      <div className="text-[10px] text-amber-500 dark:text-amber-400 mt-0.5 truncate">
        🆔 {variable.description}
      </div>
    );
  }
  // Для http_request показываем описание (метод + URL)
  if ((variable.nodeType as string) === 'http_request') {
    return (
      <div className="text-[10px] text-sky-500 dark:text-sky-400 mt-0.5 truncate">
        🌐 {variable.description}
      </div>
    );
  }
  // Для input-узлов показываем описание
  if ((variable.nodeType as string) === 'input') {
    return (
      <div className="text-[10px] text-cyan-500 dark:text-cyan-400 mt-0.5 truncate">
        ⌨️ {variable.description}
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
