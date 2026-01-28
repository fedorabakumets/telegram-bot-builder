import { Button } from "../bot-generator";

// ============================================================================
// ТИПЫ ДЛЯ УЗЛОВ БОТА
// ============================================================================
export interface BotNode {
  type: string;
  data: {
    buttons?: Button[];
    [key: string]: any;
  };
  [key: string]: any;
}