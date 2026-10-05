/**
 * @fileoverview События WebSocket чата поддержки платформы
 * @module shared/support/support-ws.types
 */

import type { SupportMessageDto, SupportSender, SupportThreadStatus } from "./support.types";

/** Общие поля события диалога, которые видят пользователь и админ */
interface SupportWsThreadFields {
  /** Идентификатор диалога */
  threadId: number;
  /** Пользователь платформы — владелец диалога */
  userId: number;
  /** Статус диалога */
  status: SupportThreadStatus;
  /** Непрочитанные администратором */
  unreadByAdmin: number;
  /** Непрочитанные пользователем */
  unreadByUser: number;
  /** Инстанс Node, опубликовавший событие. Реплика пропускает своё */
  originInstanceId: string;
}

/** Новое сообщение в диалоге */
export interface SupportWsMessageEvent extends SupportWsThreadFields {
  /** Тип события */
  type: "support:message";
  /** Сохранённое сообщение */
  message: SupportMessageDto;
}

/** Одна из сторон прочитала диалог */
export interface SupportWsReadEvent extends SupportWsThreadFields {
  /** Тип события */
  type: "support:read";
  /** Кто прочитал */
  reader: SupportSender;
}

/** Статус диалога сменили в админке */
export interface SupportWsStatusEvent extends SupportWsThreadFields {
  /** Тип события */
  type: "support:status";
}

/** Ответ на клиентский ping, только этому сокету */
export interface SupportWsPongEvent {
  /** Тип события */
  type: "pong";
}

/** Событие, которое рассылается по сокетам и в Redis */
export type SupportWsEvent = SupportWsMessageEvent | SupportWsReadEvent | SupportWsStatusEvent;

/** Любое сообщение сокета поддержки, включая pong */
export type SupportWsFrame = SupportWsEvent | SupportWsPongEvent;
