/** @fileoverview Общие сведения личного профиля и его ботов без секретов и пользовательских переменных. */
import type { UserBotMembership } from './user-bot-membership';

/** Публичные сведения бота, которому человек писал лично. */
export type DialogProfileBot = Pick<UserBotMembership, 'tokenId' | 'name' | 'username' | 'status'
  | 'incomingMessageCount' | 'buttonClickCount' | 'lastInteraction' | 'firstSavedMessageAt'
  | 'isActive' | 'isBlocked' | 'isDeleted' | 'botAvailability'>;

/** Общий профиль человека во всём проекте независимо от фильтра вкладки. */
export interface DialogProfileBotsData {
  /** Боты с сохранёнными личными сообщениями человека. */ botMemberships: DialogProfileBot[];
  /** Первая сохранённая регистрация или сообщение во всём проекте. */ registeredAt: string | null;
  /** Последняя сохранённая активность или личное сообщение во всём проекте. */ lastInteraction: string | null;
}
