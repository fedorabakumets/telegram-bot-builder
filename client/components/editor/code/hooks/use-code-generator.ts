/**
 * @fileoverview Объединённый хук генерации кода бота
 * Поддерживает два режима: client (локальная генерация) и server (через API)
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { BotData } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/queryClient';

/** Типы форматов кода */
export type CodeFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'env';

/** Режим генерации кода */
export type CodeGeneratorMode = 'client' | 'server';

/** Состояние генератора кода */
type CodeGeneratorState = Record<CodeFormat, string>;

/**
 * Параметры хука генерации кода
 */
interface UseCodeGeneratorOptions {
  /** Данные бота */
  botData: BotData;
  /** Название проекта */
  projectName: string;
  /** Включена ли база данных пользователей */
  userDatabaseEnabled?: boolean;
  /** ID проекта */
  projectId?: number | null;
  /** Режим генерации: 'client' или 'server' */
  mode?: CodeGeneratorMode;
}

/**
 * Объединённый хук для генерации кода бота в различных форматах
 * @param options - Параметры хука
 * @returns Объект с состоянием и методами генерации кода
 */
export function useCodeGenerator({
  botData,
  projectName,
  userDatabaseEnabled = false,
  projectId = null,
  mode = 'server',
}: UseCodeGeneratorOptions) {
  const { data: tokenData } = useQuery({
    queryKey: [`/api/projects/${projectId}/tokens/first`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens/first`),
    enabled: !!projectId,
    staleTime: 60000,
  });

  const { data: adminIdsData } = useQuery({
    queryKey: [`/api/projects/${projectId}/admin-ids`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/admin-ids`),
    enabled: !!projectId,
    staleTime: 60000,
  });

  const defaultToken = tokenData?.hasToken && tokenData?.token ? tokenData.token : 'YOUR_BOT_TOKEN_HERE';
  const defaultAdminIds = adminIdsData?.adminIds || '123456789';

  const [codeContent, setCodeContent] = useState<CodeGeneratorState>({
    python: '', json: '', requirements: '', readme: '', dockerfile: '', env: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const loadedFormatsRef = useRef(new Set<CodeFormat>());
  const codeContentRef = useRef<CodeGeneratorState>(codeContent);
  const prevDataRef = useRef({
    botDataStr: JSON.stringify(botData),
    projectName,
    userDatabaseEnabled,
    tokenDataStr: JSON.stringify(tokenData),
    adminIdsStr: JSON.stringify(adminIdsData),
  });

  useEffect(() => { codeContentRef.current = codeContent; }, [codeContent]);

  /**
   * Нормализует имя файла из названия проекта
   * @param name - Название проекта
   * @returns Нормализованное имя файла
   */
  const normalizeFileName = (name: string) =>
    name.toLowerCase().trim()
      .replace(/[^\p{L}\p{N}_\s-]/gu, '')
      .replace(/\s+/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^-+|-+$/g, '') || 'bot';

  /**
   * Конвертирует многолистовую структуру в простую
   * @param data - Данные бота
   * @returns Упрощённые данные бота
   */
  const convertToSimple = (data: any) => {
    if (data.nodes) return data;
    if (data.sheets && Array.isArray(data.sheets)) {
      const allNodes: any[] = [];
      data.sheets.forEach((sheet: any) => { if (sheet.nodes) allNodes.push(...sheet.nodes); });
      return { nodes: allNodes };
    }
    return { nodes: [] };
  };

  /**
   * Генерирует содержимое для выбранного формата
   * @param format - Формат кода для генерации
   * @returns Сгенерированное содержимое
   */
  const generateContent = useCallback(async (format: CodeFormat): Promise<string> => {
    try {
      // Python в server-режиме генерируется через API
      if (format === 'python' && mode === 'server' && projectId) {
        const data = await apiRequest('POST', `/api/projects/${projectId}/generate`, {
          userDatabaseEnabled,
          enableComments: true,
          enableLogging: false,
        });
        return data.code;
      }

      // Python в client-режиме — локальная генерация
      if (format === 'python' && mode === 'client') {
        let botGenerator;
        try {
          botGenerator = await import('@lib/bot-generator');
        } catch {
          return '# Ошибка генерации\n# Модуль генератора недоступен в браузере';
        }
        const storedComments = typeof window !== 'undefined' ? localStorage.getItem('botcraft-comments-generation') : null;
        return botGenerator.generatePythonCode(convertToSimple(botData) as any, {
          botName: projectName,
          groups: [],
          userDatabaseEnabled,
          projectId,
          enableGroupHandlers: false,
          enableLogging: false,
          enableComments: storedComments === 'true',
        });
      }

      const botGenerator = await import('@lib/bot-generator');

      switch (format) {
        case 'json':
          return JSON.stringify(botData, null, 2);
        case 'requirements':
          return botGenerator.generateRequirementsTxt();
        case 'readme':
          return botGenerator.generateReadme(botData, projectName, projectId || undefined, undefined, normalizeFileName(projectName));
        case 'dockerfile':
          return botGenerator.generateDockerfile();
        case 'env':
          return botGenerator.generateEnvFile(defaultToken, defaultAdminIds, projectId || 1);
        default:
          return '';
      }
    } catch (error) {
      return `# Ошибка генерации\n# ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
    }
  }, [botData, projectName, userDatabaseEnabled, projectId, mode, defaultToken, defaultAdminIds]);

  /**
   * Загружает содержимое для выбранного формата с кэшированием
   * @param selectedFormat - Формат кода для загрузки
   */
  const loadContent = useCallback(async (selectedFormat: CodeFormat) => {
    const prev = prevDataRef.current;
    const currentBotDataStr = JSON.stringify(botData);
    const currentTokenDataStr = JSON.stringify(tokenData);
    const currentAdminIdsStr = JSON.stringify(adminIdsData);

    const dataChanged =
      prev.botDataStr !== currentBotDataStr ||
      prev.projectName !== projectName ||
      prev.userDatabaseEnabled !== userDatabaseEnabled ||
      prev.tokenDataStr !== currentTokenDataStr ||
      prev.adminIdsStr !== currentAdminIdsStr;

    if (dataChanged) {
      setCodeContent({ python: '', json: '', requirements: '', readme: '', dockerfile: '', env: '' });
      loadedFormatsRef.current.clear();
      prevDataRef.current = { botDataStr: currentBotDataStr, projectName, userDatabaseEnabled, tokenDataStr: currentTokenDataStr, adminIdsStr: currentAdminIdsStr };
    }

    if (!botData) return;

    const isEnvChanged = dataChanged && selectedFormat === 'env';
    const isAlreadyLoaded = loadedFormatsRef.current.has(selectedFormat) && codeContentRef.current[selectedFormat] && !isEnvChanged;
    if (isAlreadyLoaded) return;

    setIsLoading(true);
    try {
      const content = await generateContent(selectedFormat);
      setCodeContent(prev => ({ ...prev, [selectedFormat]: content }));
      codeContentRef.current[selectedFormat] = content;
      loadedFormatsRef.current.add(selectedFormat);
    } catch (error) {
      const msg = `# Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      setCodeContent(prev => ({ ...prev, [selectedFormat]: msg }));
      codeContentRef.current[selectedFormat] = msg;
      loadedFormatsRef.current.add(selectedFormat);
    } finally {
      setIsLoading(false);
    }
  }, [botData, projectName, userDatabaseEnabled, generateContent, tokenData, adminIdsData]);

  return { codeContent, setCodeContent, isLoading, loadContent, generateContent, loadedFormatsRef };
}
