/**
 * @fileoverview Компонент проводника файлов для редактора ботов
 * 
 * Этот компонент предоставляет древовидный интерфейс для просмотра
 * сгенерированных файлов бота, аналогично проводнику в VS Code.
 * Позволяет просматривать содержимое файлов и переключаться между ними.
 * 
 * @module FileExplorerPanel
 */

import React, { useState, useMemo } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileIcon } from './file-icons'; // Импортируем созданный компонент иконок
import { FileContentView } from './file-content-view'; // Импортируем компонент просмотра содержимого
import { CodeFormat, useCodeGenerator } from '@/hooks/use-code-generator';
import { BotData, BotGroup } from '@shared/schema';

/**
 * Тип для элемента в дереве файлов
 * @interface FileTreeItem
 */
interface FileTreeItem {
  /** Уникальный идентификатор элемента */
  id: string;
  /** Имя файла или папки */
  name: string;
  /** Тип элемента: файл или папка */
  type: 'file' | 'folder';
  /** Расширение файла (для файлов) */
  extension?: string;
  /** Дочерние элементы (для папок) */
  children?: FileTreeItem[];
  /** Формат кода (для файлов) */
  codeFormat?: CodeFormat;
  /** Флаг, указывающий, открыт ли элемент */
  isOpen?: boolean;
}

/**
 * Свойства компонента проводника файлов
 * @interface FileExplorerPanelProps
 */
interface FileExplorerPanelProps {
  /** Данные бота для генерации файлов */
  botData: BotData;
  /** Название проекта */
  projectName: string;
  /** Массив групп бота */
  groups: BotGroup[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** ID проекта */
  projectId: number;
  /** Обработчик закрытия панели */
  onClose?: () => void;
}

/**
 * Компонент проводника файлов
 * 
 * Отображает древовидную структуру файлов, сгенерированных для бота,
 * и позволяет просматривать их содержимое.
 * 
 * @param {FileExplorerPanelProps} props - Свойства компонента
 * @returns {JSX.Element} Компонент проводника файлов
 */
export const FileExplorerPanel: React.FC<FileExplorerPanelProps> = ({
  botData,
  projectName,
  groups,
  userDatabaseEnabled = false,
  projectId,
  onClose
}) => {
  // Состояние для управления открытыми/закрытыми папками
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  
  // Состояние для отслеживания выбранного файла
  const [selectedFile, setSelectedFile] = useState<{format: CodeFormat, content: string, fileName: string} | null>(null);
  
  // Используем хук для генерации кода
  const { codeContent, isLoading, loadContent } = useCodeGenerator(
    botData, 
    projectName, 
    groups, 
    userDatabaseEnabled, 
    projectId
  );
  
  // Генерация дерева файлов на основе доступных форматов
  const fileTree = useMemo<FileTreeItem[]>(() => {
    const tree: FileTreeItem = {
      id: 'root',
      name: projectName,
      type: 'folder',
      isOpen: true,
      children: [
        {
          id: 'python',
          name: `${projectName.replace(/\s+/g, '_')}_bot.py`,
          type: 'file',
          extension: 'py',
          codeFormat: 'python'
        },
        {
          id: 'json',
          name: `${projectName.replace(/\s+/g, '_')}_data.json`,
          type: 'file',
          extension: 'json',
          codeFormat: 'json'
        },
        {
          id: 'requirements',
          name: 'requirements.txt',
          type: 'file',
          extension: 'txt',
          codeFormat: 'requirements'
        },
        {
          id: 'readme',
          name: 'README.md',
          type: 'file',
          extension: 'md',
          codeFormat: 'readme'
        },
        {
          id: 'dockerfile',
          name: 'Dockerfile',
          type: 'file',
          extension: '',
          codeFormat: 'dockerfile'
        },
        {
          id: 'config',
          name: 'config.yaml',
          type: 'file',
          extension: 'yaml',
          codeFormat: 'config'
        }
      ]
    };
    
    return [tree];
  }, [projectName]);

  /**
   * Переключение состояния папки (открыта/закрыта)
   * @param id - ID папки для переключения
   */
  const toggleFolder = (id: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  /**
   * Обработчик выбора файла
   * @param item - Выбранный элемент файла
   */
  const handleFileSelect = (item: FileTreeItem) => {
    if (item.codeFormat) {
      // Загружаем содержимое файла, если оно еще не загружено
      loadContent(item.codeFormat);
      
      // Обновляем состояние выбранного файла
      const content = codeContent[item.codeFormat] || '';
      setSelectedFile({
        format: item.codeFormat,
        content,
        fileName: item.name
      });
    }
  };

  /**
   * Закрытие просмотра содержимого файла
   */
  const handleCloseContentView = () => {
    setSelectedFile(null);
  };

  /**
   * Рекурсивный компонент для отображения дерева файлов
   * @param items - Массив элементов для отображения
   * @param depth - Глубина вложенности (для отступов)
   */
  const renderTreeItems = (items: FileTreeItem[], depth = 0) => {
    return items.map(item => {
      const isExpanded = expandedFolders.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      
      return (
        <div key={item.id} className="w-full">
          <div 
            className={`flex items-center py-1 px-2 hover:bg-accent rounded-sm cursor-pointer ${
              depth > 0 ? `ml-${depth * 4}` : ''
            } ${
              selectedFile && selectedFile.format === item.codeFormat ? 'bg-accent' : ''
            }`}
            onClick={() => {
              if (item.type === 'file') {
                handleFileSelect(item);
              } else if (hasChildren) {
                toggleFolder(item.id);
              }
            }}
          >
            {item.type === 'folder' ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(item.id);
                }}
              >
                <FileIcon 
                  fileType={isExpanded ? 'folder-open' : 'folder'} 
                  size={16} 
                />
              </Button>
            ) : (
              <div className="w-4 mr-1" />
            )}
            
            <FileIcon 
              fileType={item.extension ? (item.extension as any) : item.type} 
              size={16} 
              className="mr-2"
            />
            
            <span className="text-sm truncate">{item.name}</span>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="ml-4">
              {renderTreeItems(item.children!, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Заголовок панели */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center flex-shrink-0">
            <FileIcon fileType="folder" size={16} className="text-white" />
          </div>
          <h3 className="font-medium text-sm">Проводник</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-6 w-6"
        >
          <FileIcon fileType="file" size={14} />
        </Button>
      </div>
      
      {/* Основное содержимое: дерево файлов или содержимое выбранного файла */}
      <div className="flex-1 overflow-hidden">
        {selectedFile ? (
          <FileContentView
            content={selectedFile.content}
            format={selectedFile.format}
            fileName={selectedFile.fileName}
            isLoading={isLoading}
            onClose={handleCloseContentView}
          />
        ) : (
          <ScrollArea className="h-full p-2">
            <div className="space-y-1">
              {renderTreeItems(fileTree)}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};