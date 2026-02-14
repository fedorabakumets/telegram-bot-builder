import { BotData, BotGroup } from '@shared/schema';
import { CodeWithMap } from "../bot-generator";
import { generatePythonCode } from '../generatePythonCode';
import { parseCodeMap } from './parseCodeMap';

// Обновленная функция генерации с картой

export function generatePythonCodeWithMap(
  botData: BotData,
  botName: string = "MyBot",
  groups: BotGroup[] = [],
  userDatabaseEnabled: boolean = false,
  projectId: number | null = null,
  enableLogging: boolean = false
): CodeWithMap {
  // Получаем настройки проекта для определения, включать ли обработчики групп
  const enableGroupHandlers = botData?.settings?.enableGroupHandlers ?? false;
  const code = generatePythonCode(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging, enableGroupHandlers);
  return parseCodeMap(code);
}
