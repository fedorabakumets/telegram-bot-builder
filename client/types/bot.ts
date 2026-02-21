// client/types/bot.ts
// Экспортируем типы из shared/schema для использования в клиентском коде

import {
  Node as SharedNode,
  Button as SharedButton,
  BotProject,
  BotInstance,
  BotTemplate,
  BotToken,
  MediaFile,
  UserBotData,
  BotUser,
  BotGroup,
  GroupMember,
  UserTelegramSettings,
  BotMessage,
  BotMessageMedia,
  ComponentDefinition as SharedComponentDefinition
} from '@shared/schema';

// Переопределяем типы с алиасами для использования в клиенте
export type {
  SharedNode as Node,
  SharedButton as Button,
  BotProject,
  BotInstance,
  BotTemplate,
  BotToken,
  MediaFile,
  UserBotData,
  BotUser,
  BotGroup,
  GroupMember,
  UserTelegramSettings,
  BotMessage,
  BotMessageMedia,
  SharedComponentDefinition as ComponentDefinition
};

// Дополнительные типы, специфичные для клиентской части
export interface ExtendedComponentDefinition extends SharedComponentDefinition {
  position: { x: number; y: number };
  data: any;
}

export type BotData = any; // Временный тип, пока не определены точные типы для данных бота