import { BotData, BotGroup } from "../../../../../shared/schema";
import { CodeWithMap, generatePythonCode } from "../../bot-generator";
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
  const code = generatePythonCode(botData, botName, groups, userDatabaseEnabled, projectId, enableLogging);
  return parseCodeMap(code);
}
