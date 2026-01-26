import { useState, useRef, useCallback, useEffect } from 'react';
import { BotData, BotGroup } from '@shared/schema';

const loadBotGenerator = () => import('@/lib/bot-generator');

export type CodeFormat = 'python' | 'json' | 'requirements' | 'readme' | 'dockerfile' | 'config';

type CodeGeneratorState = Record<CodeFormat, string>;

// Utility function to check if debug logging is enabled
const isLoggingEnabled = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('botcraft-generator-logs') === 'true';
  }
  return false;
};

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

  const generateContent = useCallback(async (format: CodeFormat): Promise<string> => {
    try {
      const botGenerator = await loadBotGenerator();

      switch (format) {
        case 'python':
          return botGenerator.generatePythonCode(botData, projectName, groups, userDatabaseEnabled, projectId, isLoggingEnabled());
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
