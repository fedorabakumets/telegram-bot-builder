/**
 * @fileoverview Схемы листов холста и данных бота
 * @module shared/schema/tables/bot-sheets
 */

import { z } from "zod";
import { nodeSchema } from "./node-schema";

/** Схема для состояния вида листа (позиция и масштаб) */
export const sheetViewStateSchema = z.object({
  /** Позиция прокрутки */
  pan: z.object({
    /** Координата X */
    x: z.number().default(0),
    /** Координата Y */
    y: z.number().default(0),
  }).default({ x: 0, y: 0 }),
  /** Масштаб */
  zoom: z.number().default(100),
});

/** Схема для отдельного листа холста */
export const canvasSheetSchema = z.object({
  /** Уникальный идентификатор листа */
  id: z.string(),
  /** Название листа */
  name: z.string(),
  /** Узлы на листе */
  nodes: z.array(nodeSchema).default([]),
  /** Состояние вида */
  viewState: sheetViewStateSchema.default({ pan: { x: 0, y: 0 }, zoom: 100 }),
  /** Дата создания */
  createdAt: z.date().optional(),
  /** Дата обновления */
  updatedAt: z.date().optional(),
});

/** Обновленная схема данных бота с поддержкой листов */
export const botDataWithSheetsSchema = z.object({
  /** Массив листов */
  sheets: z.array(canvasSheetSchema).default([]),
  /** Активный лист */
  activeSheetId: z.string().optional(),
  /** Версия структуры данных для миграции */
  version: z.number().default(2),
});

/** Старая схема для обратной совместимости */
export const botDataSchema = z.object({
  /** Узлы бота */
  nodes: z.array(nodeSchema),
});

/** Тип состояния вида листа */
export type SheetViewState = z.infer<typeof sheetViewStateSchema>;

/** Тип листа холста */
export type CanvasSheet = z.infer<typeof canvasSheetSchema>;

/** Тип данных бота с листами */
export type BotDataWithSheets = z.infer<typeof botDataWithSheetsSchema>;

/** Тип данных бота (старая схема) */
export type BotData = z.infer<typeof botDataSchema>;
