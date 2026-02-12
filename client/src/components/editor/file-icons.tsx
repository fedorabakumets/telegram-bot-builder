/**
 * @fileoverview Компонент иконок для файлов и папок в проводнике
 * 
 * Этот компонент предоставляет иконки для различных типов файлов
 * в проводнике файлов, аналогично тому, как это реализовано в VS Code
 * 
 * @module FileIcons
 */

import React from 'react';
import { Folder, File, FileCode, FileText, FileImage, FileAudio, FileVideo, FolderOpen } from 'lucide-react';

/**
 * Типы файлов для определения соответствующей иконки
 */
type FileType = 
  | 'folder' 
  | 'folder-open' 
  | 'file' 
  | 'python' 
  | 'json' 
  | 'javascript' 
  | 'typescript' 
  | 'html' 
  | 'css' 
  | 'image' 
  | 'audio' 
  | 'video' 
  | 'text' 
  | 'markdown'
  | 'yaml'
  | 'dockerfile'
  | 'requirements';

/**
 * Свойства компонента иконки файла
 * @interface FileIconProps
 */
interface FileIconProps {
  /** Тип файла для отображения соответствующей иконки */
  fileType: FileType;
  /** Размер иконки */
  size?: number;
  /** Дополнительные CSS классы */
  className?: string;
  /** Открытая папка или закрытая (только для типа folder) */
  isOpen?: boolean;
}

/**
 * Компонент иконки файла или папки
 * 
 * @param {FileIconProps} props - Свойства компонента
 * @returns {JSX.Element} Иконка файла или папки
 */
export const FileIcon: React.FC<FileIconProps> = ({ 
  fileType, 
  size = 16, 
  className = '', 
  isOpen = false 
}) => {
  const iconProps = {
    size,
    className: `flex-shrink-0 ${className}`
  };

  switch (fileType) {
    case 'folder':
      return isOpen ? <FolderOpen {...iconProps} /> : <Folder {...iconProps} />;
    case 'folder-open':
      return <FolderOpen {...iconProps} />;
    case 'python':
      return <FileCode {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
    case 'json':
    case 'javascript':
    case 'typescript':
      return <FileCode {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    case 'html':
      return <FileCode {...iconProps} className={`${iconProps.className} text-orange-500`} />;
    case 'css':
      return <FileCode {...iconProps} className={`${iconProps.className} text-blue-400`} />;
    case 'image':
      return <FileImage {...iconProps} className={`${iconProps.className} text-green-500`} />;
    case 'audio':
      return <FileAudio {...iconProps} className={`${iconProps.className} text-purple-500`} />;
    case 'video':
      return <FileVideo {...iconProps} className={`${iconProps.className} text-red-500`} />;
    case 'markdown':
    case 'text':
      return <FileText {...iconProps} className={`${iconProps.className} text-gray-500`} />;
    case 'yaml':
    case 'dockerfile':
    case 'requirements':
      return <FileCode {...iconProps} className={`${iconProps.className} text-indigo-500`} />;
    default:
      return <File {...iconProps} className={`${iconProps.className} text-gray-400`} />;
  }
};