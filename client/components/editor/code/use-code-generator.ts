import { useState, useRef, useCallback, useEffect } from 'react';
import { BotData } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

/**
 * Асинхронная функция для загрузки генератора ботов
 * @returns {Promise<any>} Модуль генератора ботов
 */
const loadBotGenerator = () => import('@/lib/bot-generator');

/**
 * Типы форматов кода, которые можно сгенерировать
 * @typedef {'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'env'} CodeFormat
 */
export type CodeFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'env';

/**
 * Тип состояния генератора кода
 * @typedef {Record<CodeFormat, string>} CodeGeneratorState
 */
type CodeGeneratorState = Record<CodeFormat, string>;

/**
 * Хук для генерации кода бота в различных форматах
 *
 * @param {BotData} botData - Данные бота для генерации кода
 * @param {string} projectName - Название проекта
 * @param {boolean} [userDatabaseEnabled=false] - Включена ли база данных пользователей
 * @param {number | null} [projectId=null] - ID проекта (опционально)
 * @returns {Object} Объект с состоянием и методами генерации кода
 * @returns {CodeGeneratorState} Object.codeContent - Состояние сгенерированного кода для каждого формата
 * @returns {Function} Object.setCodeContent - Функция для установки состояния кода
 * @returns {boolean} Object.isLoading - Состояние загрузки
 * @returns {Function} Object.loadContent - Функция для загрузки содержимого для выбранного формата
 * @returns {Function} Object.generateContent - Функция для генерации содержимого для выбранного формата
 * @returns {MutableRefObject<Set<CodeFormat>>} Object.loadedFormatsRef - Ссылка на набор загруженных форматов
 *
 * @example
 * ```typescript
 * const { codeContent, isLoading, loadContent } = useCodeGenerator(
 *   botData,
 *   'my-bot-project',
 *   true,
 *   123
 * );
 *
 * // Загрузка Python-кода
 * useEffect(() => {
 *   loadContent('python');
 * }, [loadContent]);
 *
 * // Использование сгенерированного кода
 * return (
 *   <pre>{codeContent.python}</pre>
 * );
 * ```
 */
export function useCodeGenerator(botData: BotData, projectName: string, userDatabaseEnabled: boolean = false, projectId: number | null = null) {
  // Загружаем полный токен проекта через React Query (для .env)
  const { data: tokenData } = useQuery({
    queryKey: [`/api/projects/${projectId}/tokens/first`],
    queryFn: () => apiRequest('GET', `/api/projects/${projectId}/tokens/first`),
    enabled: !!projectId,
    staleTime: 60000, // 1 минута
  });

  // Получаем токен или значение по умолчанию
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
  const prevDataRef = useRef({
    botDataStr: JSON.stringify(botData),
    projectName,
    userDatabaseEnabled,
    tokenDataStr: JSON.stringify(tokenData)
  });

  // Синхронизируем ref с состоянием
  useEffect(() => {
    codeContentRef.current = codeContent;
  }, [codeContent]);

  /**
   * Функция для генерации содержимого для выбранного формата
   *
   * @param {CodeFormat} format - Формат кода для генерации
   * @returns {Promise<string>} Сгенерированное содержимое
   */
  const generateContent = useCallback(async (format: CodeFormat): Promise<string> => {
    try {
      const botGenerator = await loadBotGenerator();

      // Конвертируем многолистовую структуру в простую для генератора
      const convertSheetsToSimpleBotData = (data: any) => {
        // Если уже простая структура - возвращаем как есть
        if (data.nodes) {
          return data;
        }

        // Если многолистовая структура - собираем все узлы
        if (data.sheets && Array.isArray(data.sheets)) {
          let allNodes: any[] = [];

          data.sheets.forEach((sheet: any) => {
            if (sheet.nodes) allNodes.push(...sheet.nodes);
          });

          return {
            nodes: allNodes
          };
        }

        // Если нет узлов вообще - возвращаем пустую структуру
        return {
          nodes: []
        };
      };

      const simpleBotData = convertSheetsToSimpleBotData(botData);

      switch (format) {
        case 'python':
          // Получаем настройки генерации комментариев из localStorage
          // По умолчанию включено (консистентность с сервером)
          const storedComments = typeof window !== 'undefined' ?
            localStorage.getItem('botcraft-comments-generation') : null;
          const enableComments = storedComments !== null ? storedComments === 'true' : true;
          // Используем пустой массив групп и false для enableGroupHandlers для консистентности с сервером
          return botGenerator.generatePythonCode(simpleBotData as any, projectName, [], userDatabaseEnabled, projectId, false, false, enableComments);
        case 'json':
          return JSON.stringify(botData, null, 2);
        case 'requirements':
          return botGenerator.generateRequirementsTxt();
        case 'readme':
          // Нормализуем имя проекта для использования в качестве имени файла
          const customFileName = projectName
            .toLowerCase()
            .trim()
            .replace(/[^\p{L}\p{N}_\s-]/gu, '')
            .replace(/\s+/g, '_')
            .replace(/_{2,}/g, '_')
            .replace(/^-+|-+$/g, '') || 'bot';
          return botGenerator.generateReadme(botData, projectName, projectId || undefined, undefined, customFileName);
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
  }, [botData, projectName, userDatabaseEnabled, projectId, tokenData]);

  /**
   * Функция для загрузки содержимого для выбранного формата
   *
   * @param {CodeFormat} selectedFormat - Формат кода для загрузки
   */
  const loadContent = useCallback(async (selectedFormat: CodeFormat) => {
    // Проверяем, изменились ли данные
    const prev = prevDataRef.current;
    const currentBotDataStr = JSON.stringify(botData);
    const currentTokenDataStr = JSON.stringify(tokenData);
    const dataChanged = prev.botDataStr !== currentBotDataStr ||
      prev.projectName !== projectName ||
      prev.userDatabaseEnabled !== userDatabaseEnabled ||
      prev.tokenDataStr !== currentTokenDataStr;

    if (dataChanged) {
      setCodeContent({
        python: '',
        json: '',
        requirements: '',
        readme: '',
        dockerfile: '',
        env: ''
      });
      loadedFormatsRef.current.clear();
      prevDataRef.current = {
        botDataStr: currentBotDataStr,
        projectName,
        userDatabaseEnabled,
        tokenDataStr: currentTokenDataStr
      };
    }

    if (!botData) return;

    // Если уже загружен, не генерируем снова (кроме .env при изменении токена)
    const isEnvFormat = selectedFormat === 'env';
    const hasTokenChanged = dataChanged && isEnvFormat;
    const isAlreadyLoaded = loadedFormatsRef.current.has(selectedFormat) && codeContentRef.current[selectedFormat] && !hasTokenChanged;
    
    if (isAlreadyLoaded) {
      return;
    }

    setIsLoading(true);

    try {
      const content = await generateContent(selectedFormat);
      setCodeContent(prev => ({ ...prev, [selectedFormat]: content }));
      codeContentRef.current[selectedFormat] = content;
      loadedFormatsRef.current.add(selectedFormat);
    } catch (error) {
      const errorMessage = `# Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
      setCodeContent(prev => ({ ...prev, [selectedFormat]: errorMessage }));
      codeContentRef.current[selectedFormat] = errorMessage;
      loadedFormatsRef.current.add(selectedFormat);
    } finally {
      setIsLoading(false);
    }
  }, [botData, projectName, userDatabaseEnabled, generateContent, codeContent]);

  return {
    codeContent,
    setCodeContent,
    isLoading,
    loadContent,
    generateContent,
    loadedFormatsRef
  };
}
