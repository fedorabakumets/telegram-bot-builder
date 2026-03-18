/**
 * @fileoverview Хук для генерации кода бота с использованием серверной генерации
 * 
 * Использует API для генерации Python кода, локальную генерацию для остальных форматов
 * 
 * @module client/components/editor/code/useCodeGeneratorServer
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { BotData } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/** Типы форматов кода */
export type CodeFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'env';

/** Состояние генератора кода */
type CodeGeneratorState = Record<CodeFormat, string>;

/**
 * Хук для генерации кода бота в различных форматах
 * 
 * @param botData - Данные бота для генерации кода
 * @param projectName - Название проекта
 * @param userDatabaseEnabled - Включена ли база данных пользователей
 * @param projectId - ID проекта
 * @returns Объект с состоянием и методами генерации кода
 */
export function useCodeGeneratorServer(
  botData: BotData,
  projectName: string,
  userDatabaseEnabled: boolean = false,
  projectId: number | null = null
) {
  // Загружаем токен проекта через React Query
  const { data: tokenData } = useQuery({
    queryKey: [`/api/projects/${projectId}/tokens/first`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens/first`),
    enabled: !!projectId,
    staleTime: 60000,
  });

  const defaultToken = tokenData?.hasToken && tokenData?.token ? tokenData.token : 'YOUR_BOT_TOKEN_HERE';

  const [codeContent, setCodeContent] = useState<CodeGeneratorState>({
    python: '',
    json: '',
    requirements: '',
    readme: '',
    dockerfile: '',
    env: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const loadedFormatsRef = useRef(new Set<CodeFormat>());
  const codeContentRef = useRef<CodeGeneratorState>(codeContent);

  useEffect(() => {
    codeContentRef.current = codeContent;
  }, [codeContent]);

  /**
   * Генерирует содержимое для выбранного формата
   * 
   * @param format - Формат кода для генерации
   * @returns Сгенерированное содержимое
   */
  const generateContent = useCallback(async (format: CodeFormat): Promise<string> => {
    try {
      // Python код генерируем на сервере
      if (format === 'python' && projectId) {
        const data = await apiRequest('POST', `/api/projects/${projectId}/generate`, {
          userDatabaseEnabled,
          enableComments: true,
          enableLogging: false,
        });
        return data.code;
      }

      // Остальные форматы генерируем локально
      const botGenerator = await import('@lib/bot-generator');
      
      switch (format) {
        case 'json':
          return JSON.stringify(botData, null, 2);
        case 'requirements':
          return botGenerator.generateRequirementsTxt();
        case 'readme': {
          const customFileName = projectName
            .toLowerCase()
            .trim()
            .replace(/[^\p{L}\p{N}_\s-]/gu, '')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^-+|-+$/g, '') || 'bot';
          return botGenerator.generateReadme(botData, projectName, projectId || undefined, undefined, customFileName);
        }
        case 'dockerfile':
          return botGenerator.generateDockerfile();
        case 'env':
          return botGenerator.generateEnvFile(defaultToken, "123456789", projectId || 1);
        default:
          return '';
      }
    } catch (error) {
      return `# Ошибка генерации\n# ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
    }
  }, [botData, projectName, userDatabaseEnabled, projectId, defaultToken]);

  /**
   * Загружает содержимое для выбранного формата
   * 
   * @param selectedFormat - Формат кода для загрузки
   */
  const loadContent = useCallback(async (selectedFormat: CodeFormat) => {
    if (!botData) return;

    const isAlreadyLoaded = loadedFormatsRef.current.has(selectedFormat) && codeContentRef.current[selectedFormat];

    if (isAlreadyLoaded) return;

    setIsLoading(true);

    try {
      const content = await generateContent(selectedFormat);
      setCodeContent(prev => ({ ...prev, [selectedFormat]: content }));
      loadedFormatsRef.current.add(selectedFormat);
    } catch (error) {
      const errorMessage = `# Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      setCodeContent(prev => ({ ...prev, [selectedFormat]: errorMessage }));
      loadedFormatsRef.current.add(selectedFormat);
    } finally {
      setIsLoading(false);
    }
  }, [botData, generateContent]);

  return {
    codeContent,
    setCodeContent,
    isLoading,
    loadContent,
    generateContent,
    loadedFormatsRef
  };
}
