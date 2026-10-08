/**
 * @fileoverview Административная проверка доставки бэкапов в Telegram.
 */
import type { Request, Response } from "express";
import { testTelegramBackupDelivery } from "../database/backups/telegramBackupDelivery";

/**
 * Отправляет проверочный файл по сохранённым реквизитам.
 * @param _req - Административный запрос без тела
 * @param res - Результат без секретов
 */
export async function handleTestBackupTelegram(_req: Request, res: Response): Promise<void> {
  try {
    await testTelegramBackupDelivery();
    res.json({ ok: true });
  } catch (error) {
    res.status(400).json({ message: error instanceof Error ? error.message : "Не удалось проверить Telegram" });
  }
}
