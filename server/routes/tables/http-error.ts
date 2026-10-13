/**
 * @fileoverview Короткие ответы и разбор идентификаторов маршрутов таблиц
 * @module routes/tables/http-error
 */

import type { Response } from "express";

/**
 * Отправляет JSON-ошибку
 * @param res - Ответ
 * @param status - Код
 * @param message - Текст
 */
export function fail(res: Response, status: number, message: string): void {
  res.status(status).json({ message });
}

/**
 * Читает положительное целое из параметра пути
 * @param raw - Строка параметра
 * @returns Число или null
 */
export function positiveId(raw: string | undefined): number | null {
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * Превращает ошибку SQL в безопасный ответ
 * @param error - Исключение
 * @returns Код и сообщение
 */
export function sqlFailure(error: unknown): { status: number; message: string } {
  const code = error && typeof error === "object" && "code" in error ? String((error as { code: unknown }).code) : "";
  if (code === "57014") return { status: 400, message: "Запрос превысил лимит времени" };
  console.error("[tables]", error);
  return { status: 500, message: "Не удалось выполнить запрос" };
}
