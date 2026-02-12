/**
 * @fileoverview Компонент проводника файлов для редактора ботов
 *
 * Этот компонент предоставляет древовидный интерфейс для просмотра
 * сгенерированных файлов бота, аналогично проводнику в VS Code.
 * Позволяет просматривать содержимое файлов и переключаться между ними.
 * Интегрирован с генератором кода для получения актуальных данных.
 *
 * @module FileExplorerPanel
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { FileIcon } from './file-icons';
import { FileContentView } from './file-content-view';
import { CodeFormat, useCodeGenerator } from '@/hooks/use-code-generator';
import { BotData, BotGroup } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

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
  groups?: BotGroup[];
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

  // Загрузка списка групп для включения в генерацию кода
  const { data: fetchedGroups = [] } = useQuery<BotGroup[]>({
    queryKey: ['/api/groups'],
    // Используем переданные группы как начальное значение, если они есть
    initialData: groups,
  });

  // Используем хук для генерации кода
  const { codeContent, isLoading, loadContent, loadedFormatsRef } = useCodeGenerator(
    botData,
    projectName,
    fetchedGroups,
    userDatabaseEnabled,
    projectId
  );

  // Отладочная информация
  console.log('FileExplorerPanel props:', { projectName, projectId, userDatabaseEnabled, botData, fetchedGroups });
  console.log('Generated code content:', codeContent);
  
  // Проверяем, содержит ли botData необходимые данные
  const hasValidBotData = botData && botData.nodes && Array.isArray(botData.nodes) && botData.nodes.length > 0;
  const hasValidConnections = botData && botData.connections && Array.isArray(botData.connections);
  console.log('Has valid bot data:', hasValidBotData);
  console.log('Has valid connections:', hasValidConnections);
  console.log('Bot data nodes count:', botData?.nodes?.length || 0);
  console.log('Bot data connections count:', botData?.connections?.length || 0);
  
  // Если botData undefined, покажем сообщение об ошибке
  if (!botData) {
    console.log('botData is undefined - waiting for data');
  }

  // Синхронизация с текущими данными бота
  // При изменении botData, groups или других параметров, обновляем состояние
  React.useEffect(() => {
    // Обновляем дерево файлов при изменении данных бота
    // Это обеспечивает синхронизацию с текущими данными
    console.log('Данные бота обновлены, синхронизируем файлы');
    console.log('New botData:', botData);
    
    // Проверяем, есть ли действительные данные бота
    const hasValidBotData = botData && botData.nodes && Array.isArray(botData.nodes) && botData.nodes.length > 0;
    const hasValidConnections = botData && botData.connections && Array.isArray(botData.connections);
    console.log('Has valid bot data after update:', hasValidBotData);
    console.log('Has valid connections after update:', hasValidConnections);
    
    // Если botData определен и есть действительные данные, но код еще не сгенерирован, генерируем его
    if (botData && hasValidBotData) {
      const formats: CodeFormat[] = ['python', 'json', 'requirements', 'readme', 'dockerfile', 'config'];
      formats.forEach(format => {
        const isLoaded = loadedFormatsRef.current.has(format);
        const isEmpty = !codeContent[format] || codeContent[format].trim() === '';
        
        console.log(`Checking format ${format}: isLoaded=${isLoaded}, isEmpty=${isEmpty}`);
        
        if (!isLoaded || isEmpty) {
          console.log(`Loading content for format: ${format}`);
          loadContent(format);
        }
      });
    } else if (!botData) {
      console.log('Skipping code generation - botData is undefined');
    } else {
      console.log('Skipping code generation - no valid bot data');
    }
    
    // Если файл уже выбран, обновим его содержимое
    if (selectedFile) {
      const updatedContent = codeContent[selectedFile.format] || '';
      setSelectedFile({
        ...selectedFile,
        content: updatedContent
      });
    }
  }, [botData, fetchedGroups, userDatabaseEnabled, codeContent, selectedFile, loadContent, loadedFormatsRef]);

  // Загрузка содержимого выбранного файла при его изменении
  React.useEffect(() => {
    if (selectedFile) {
      // Проверяем, нужно ли загрузить содержимое для выбранного файла
      const isLoaded = loadedFormatsRef.current.has(selectedFile.format);
      const isEmpty = !codeContent[selectedFile.format] || codeContent[selectedFile.format].trim() === '';
      
      if (!isLoaded || isEmpty) {
        loadContent(selectedFile.format);
      }
    }
  }, [selectedFile, codeContent, loadContent, loadedFormatsRef]);

  // Эффект для отслеживания изменения botData и генерации кода при появлении действительных данных
  React.useEffect(() => {
    if (botData && botData.nodes && Array.isArray(botData.nodes) && botData.nodes.length > 0) {
      console.log('Действительные данные бота появились, запускаем генерацию кода');
      // Загружаем все форматы кода
      const formats: CodeFormat[] = ['python', 'json', 'requirements', 'readme', 'dockerfile', 'config'];
      formats.forEach(format => {
        const isLoaded = loadedFormatsRef.current.has(format);
        const isEmpty = !codeContent[format] || codeContent[format].trim() === '';
        
        if (!isLoaded || isEmpty) {
          console.log(`Загружаем контент для формата: ${format}`);
          loadContent(format);
        }
      });
    }
  }, [botData, codeContent, loadContent, loadedFormatsRef]);

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
          name: `bot_${projectId}.py`,
          type: 'file',
          extension: 'py',
          codeFormat: 'python'
        },
        {
          id: 'json',
          name: 'project.json',
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
  }, [projectName, projectId]);

  /**
   * Переключение состояния папки (открыта/закрыта)
   * @param id - ID папки для переключения
   */
  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  /**
   * Обработчик выбора файла
   * @param item - Выбранный элемент файла
   */
  const handleFileSelect = useCallback((item: FileTreeItem) => {
    if (item.codeFormat) {
      // Проверяем, есть ли действительные данные бота перед загрузкой
      const hasValidBotData = botData && botData.nodes && Array.isArray(botData.nodes) && botData.nodes.length > 0;
      
      if (!hasValidBotData) {
        console.log('No valid bot data available, cannot load file content');
        setSelectedFile({
          format: item.codeFormat,
          content: '# Ошибка: Нет данных для генерации кода\n# Пожалуйста, добавьте узлы в схему бота',
          fileName: item.name
        });
        return;
      }
      
      // Загружаем содержимое файла, если оно еще не загружено или пустое
      // Проверяем, нужно ли принудительно перезагрузить содержимое
      const isLoaded = loadedFormatsRef.current.has(item.codeFormat);
      const isEmpty = !codeContent[item.codeFormat] || codeContent[item.codeFormat].trim() === '';
      
      console.log(`Selecting file ${item.name}: isLoaded=${isLoaded}, isEmpty=${isEmpty}`);
      
      if (!isLoaded || isEmpty) {
        console.log(`Loading content for format: ${item.codeFormat}`);
        loadContent(item.codeFormat);
      }

      // Обновляем состояние выбранного файла
      const content = codeContent[item.codeFormat] || '';
      setSelectedFile({
        format: item.codeFormat,
        content,
        fileName: item.name
      });
    }
  }, [botData, codeContent, loadContent, loadedFormatsRef]);

  /**
   * Функция для проверки, загружен ли формат
   * @param format - Формат кода для проверки
   * @returns boolean - true, если формат загружен
   */
  const isFormatLoaded = useCallback((format: CodeFormat): boolean => {
    return loadedFormatsRef.current.has(format);
  }, []);

  /**
   * Функция для получения состояния загрузки конкретного формата
   * @param format - Формат кода для проверки
   * @returns boolean - true, если формат в процессе загрузки
   */
  const isLoadingFormat = useCallback((format: CodeFormat): boolean => {
    return isLoading && !isFormatLoaded(format);
  }, [isLoading, isFormatLoaded]);

  /**
   * Закрытие просмотра содержимого файла
   */
  const handleCloseContentView = useCallback(() => {
    setSelectedFile(null);
  }, []);

  /**
   * Рекурсивный компонент для отображения дерева файлов
   * @param items - Массив элементов для отображения
   * @param depth - Глубина вложенности (для отступов)
   */
  const renderTreeItems = useCallback((items: FileTreeItem[], depth = 0) => {
    return items.map(item => {
      const isExpanded = expandedFolders.has(item.id);
      const hasChildren = item.children && item.children.length > 0;
      const isCurrentlyLoading = item.codeFormat ? isLoadingFormat(item.codeFormat) : false;

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
            ) : isCurrentlyLoading ? (
              // Показываем индикатор загрузки для файла, который в процессе генерации
              <div className="w-4 mr-1 flex justify-center">
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-blue-500"></div>
              </div>
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
  }, [expandedFolders, selectedFile, handleFileSelect, toggleFolder, isLoadingFormat]);

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
              {renderTreeItems(fileTree, 0)}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Индикатор глобальной загрузки */}
      {isLoading && (
        <div className="absolute bottom-4 right-4 bg-gray-800 text-white text-xs py-1 px-2 rounded-md flex items-center">
          <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white mr-2"></div>
          {selectedFile 
            ? `Загрузка содержимого: ${selectedFile.fileName}...` 
            : 'Генерация файлов...'}
        </div>
      )}
    </div>
  );
};