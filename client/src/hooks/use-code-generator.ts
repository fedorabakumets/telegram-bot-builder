import { useState, useRef, useCallback } from 'react';
import { BotData, BotGroup } from '@shared/schema';

/**
 * Асинхронная функция для загрузки генератора ботов
 * @returns {Promise<any>} Модуль генератора ботов
 */
const loadBotGenerator = () => import('@/lib/bot-generator');

/**
 * Типы форматов кода, которые можно сгенерировать
 * @typedef {'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'config'} CodeFormat
 */
export type CodeFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'config';

/**
 * Тип состояния генератора кода
 * @typedef {Record<CodeFormat, string>} CodeGeneratorState
 */
type CodeGeneratorState = Record<CodeFormat, string>;

/**
 * Вспомогательная функция для проверки включения логирования отладки
 * @returns {boolean} true, если логирование включено, иначе false
 */
const isLoggingEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('botcraft-generator-logs') === 'true';
  }
  return false;
};

/**
 * Хук для генерации кода бота в различных форматах
 *
 * @param {BotData} botData - Данные бота для генерации кода
 * @param {string} projectName - Название проекта
 * @param {BotGroup[]} groups - Массив групп бота
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
 *   groups,
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
export function useCodeGenerator(botData: BotData, projectName: string, groups: BotGroup[], userDatabaseEnabled: boolean = false, projectId: number | null = null) {
  const [codeContent, setCodeContent] = useState<CodeGeneratorState>({
    python: '',
    json: '',
    requirements: '',
    readme: '',
    dockerfile: '',
    config: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const loadedFormatsRef = useRef(new Set<CodeFormat>());
  const prevDataRef = useRef({
    botDataStr: JSON.stringify(botData),
    projectName,
    groupsStr: JSON.stringify(groups),
    userDatabaseEnabled
  });

  /**
   * Функция для генерации содержимого для выбранного формата
   *
   * @param {CodeFormat} format - Формат кода для генерации
   * @returns {Promise<string>} Сгенерированное содержимое
   */
  const generateContent = useCallback(async (format: CodeFormat): Promise<string> => {
    try {
      const botGenerator = await loadBotGenerator();

      switch (format) {
        case 'python':
          // Получаем настройки проекта для определения, включать ли обработчики групп
          const enableGroupHandlers = botData?.settings?.enableGroupHandlers ?? false;
          return botGenerator.generatePythonCode(botData, projectName, groups, userDatabaseEnabled, projectId, isLoggingEnabled(), enableGroupHandlers);
        case 'json':
          return JSON.stringify(botData, null, 2);
        case 'requirements':
          return botGenerator.generateRequirementsTxt();
        case 'readme':
          return botGenerator.generateReadme(botData, projectName);
        case 'dockerfile':
          return botGenerator.generateDockerfile();
        case 'config':
          return botGenerator.generateConfigYaml(projectName);
        default:
          return '';
      }
    } catch (error) {
      if (isLoggingEnabled()) console.error('Error generating content:', error);
      return `# Ошибка генерации\n# ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`;
    }
  }, [botData, projectName, groups, userDatabaseEnabled, projectId]);

  /**
   * Функция для загрузки содержимого для выбранного формата
   *
   * @param {CodeFormat} selectedFormat - Формат кода для загрузки
   */
  const loadContent = useCallback(async (selectedFormat: CodeFormat) => {
    // Проверяем, изменились ли данные
    const prev = prevDataRef.current;
    const currentBotDataStr = JSON.stringify(botData);
    const currentGroupsStr = JSON.stringify(groups);
    const dataChanged = prev.botDataStr !== currentBotDataStr ||
      prev.projectName !== projectName ||
      prev.groupsStr !== currentGroupsStr ||
      prev.userDatabaseEnabled !== userDatabaseEnabled;

    if (dataChanged) {
      if (isLoggingEnabled()) console.log('🔄 useCodeGenerator: Данные изменились, сбрасываем весь кеш');
      setCodeContent({
        python: '',
        json: '',
        requirements: '',
        readme: '',
        dockerfile: '',
        config: ''
      });
      loadedFormatsRef.current.clear();
      prevDataRef.current = {
        botDataStr: currentBotDataStr,
        projectName,
        groupsStr: currentGroupsStr,
        userDatabaseEnabled
      };
    }

    if (!botData) return;

    // Если уже загружен, не генерируем снова
    if (loadedFormatsRef.current.has(selectedFormat) && codeContent[selectedFormat]) {
      if (isLoggingEnabled()) console.log('✅ useCodeGenerator: Контент уже загружен для', selectedFormat);
      return;
    }

    if (isLoggingEnabled()) console.log('🔄 useCodeGenerator: Генерация контента для', selectedFormat);
    setIsLoading(true);

    try {
      const content = await generateContent(selectedFormat);
      if (isLoggingEnabled()) console.log('✅ useCodeGenerator: Контент загружен для', selectedFormat);
      setCodeContent(prev => ({ ...prev, [selectedFormat]: content }));
      loadedFormatsRef.current.add(selectedFormat);
    } catch (error) {
      if (isLoggingEnabled()) console.error('❌ useCodeGenerator: Ошибка загрузки:', error);
      setCodeContent(prev => ({
        ...prev,
        [selectedFormat]: `# Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
      }));
      loadedFormatsRef.current.add(selectedFormat);
    } finally {
      setIsLoading(false);
    }
  }, [botData, projectName, groups, userDatabaseEnabled, generateContent, codeContent]);

  return {
    codeContent,
    setCodeContent,
    isLoading,
    loadContent,
    generateContent,
    loadedFormatsRef
  };
}
