/**
 * @fileoverview Бейдж медиа-переменной
 * 
 * Отображает одну медиа-переменную с иконкой и кнопкой удаления.
 */

import { Image, Video, Music, FileText } from 'lucide-react';

/** Тип медиа-переменной */
interface MediaVariable {
  /** Имя переменной */
  name: string;
  /** Тип медиа */
  mediaType: 'photo' | 'video' | 'audio' | 'document';
  /** Описание переменной */
  description: string;
  /** ID узла */
  nodeId: string;
}

/** Пропсы компонента бейджа */
interface MediaVariableBadgeProps {
  /** Медиа-переменная */
  variable: MediaVariable;
  /** Функция удаления переменной */
  onRemove: (name: string) => void;
}

/**
 * Компонент бейджа медиа-переменной
 * 
 * @param {MediaVariableBadgeProps} props - Пропсы компонента
 * @returns {JSX.Element} Бейдж медиа-переменной
 */
export function MediaVariableBadge({ variable, onRemove }: MediaVariableBadgeProps) {
  const getMediaIcon = () => {
    switch (variable.mediaType) {
      case 'photo': return <Image className="h-3 w-3" />;
      case 'video': return <Video className="h-3 w-3" />;
      case 'audio': return <Music className="h-3 w-3" />;
      case 'document': return <FileText className="h-3 w-3" />;
      default: return null;
    }
  };

  const getMediaColor = () => {
    switch (variable.mediaType) {
      case 'photo': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700';
      case 'video': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700';
      case 'audio': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700';
      case 'document': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  return (
    <div
      key={`${variable.nodeId}-${variable.name}`}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium ${getMediaColor()}`}
    >
      {getMediaIcon()}
      <code className="font-mono">{`{${variable.name}}`}</code>
      <span className="text-[10px] opacity-70">{variable.description}</span>
      <button
        onClick={() => onRemove(variable.name)}
        className="ml-1 text-xs opacity-50 hover:opacity-100 transition-opacity"
        title="Удалить медиафайл"
      >
        ✕
      </button>
    </div>
  );
}
