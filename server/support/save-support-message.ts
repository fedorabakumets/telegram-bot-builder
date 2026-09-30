/**
 * @fileoverview Сохранение сообщения поддержки вместе с картинками в активное хранилище
 * @module server/support/save-support-message
 */

import { randomUUID } from "crypto";
import { readFile, unlink } from "fs/promises";
import { supportMessages } from "@shared/schema";
import { detectSupportImage } from "@shared/support/support-image";
import type { SupportMessageContext, SupportMessageDto, SupportSender } from "@shared/support/support.types";
import { eq } from "drizzle-orm";
import { db } from "../database/db";
import { getStorageRegistry } from "../storage/storage-registry";
import { insertSupportAttachments, type InsertSupportAttachment } from "./support-attachments-repo";
import { toSupportMessageDto } from "./support-dto";
import { addSupportMessage } from "./support-messages-repo";

/** Ошибка отправки, которую можно отдать клиенту */
export class SupportMessageError extends Error {
  /** HTTP-статус */
  readonly status: number;

  /**
   * @param status - Код ответа
   * @param message - Текст ошибки
   */
  constructor(status: number, message: string) {
    super(message);
    this.name = "SupportMessageError";
    this.status = status;
  }
}

/** Параметры сообщения с уже проверенными файлами multer */
export interface SaveSupportMessageParams {
  /** Диалог */
  threadId: number;
  /** Отправитель */
  sender: SupportSender;
  /** Текст, может быть пустым */
  text: string;
  /** Контекст пользователя */
  context?: SupportMessageContext | null;
  /** Временные файлы с диска */
  files: Express.Multer.File[];
}

/**
 * Оставляет в имени только безопасные символы
 * @param original - Имя из браузера
 * @param ext - Расширение по содержимому
 * @returns Имя для ключа хранилища
 */
function safeFileName(original: string, ext: string): string {
  const base = original.replace(/[/\\]/g, "").replace(/[^\w.\-]+/g, "_").slice(0, 80);
  if (!base || base === "." || base === "..") return `image.${ext}`;
  return base.includes(".") ? base : `${base}.${ext}`;
}

/**
 * Читает временные файлы и проверяет, что каждый — картинка
 * @param files - Файлы multer
 * @returns Буферы и имена
 */
async function readImages(files: Express.Multer.File[]) {
  const prepared: Array<{ buffer: Buffer; mime: string; name: string }> = [];
  try {
    for (const file of files) {
      const buffer = await readFile(file.path);
      const kind = detectSupportImage(buffer);
      if (!kind) {
        throw new SupportMessageError(400, "Можно отправить только картинки png, jpeg, webp и gif");
      }
      prepared.push({ buffer, mime: kind.mime, name: safeFileName(file.originalname || "", kind.ext) });
    }
  } finally {
    await Promise.all(files.map((file) => unlink(file.path).catch(() => undefined)));
  }
  return prepared;
}

/**
 * Сохраняет сообщение и кладёт картинки в активное хранилище.
 * Ключ: support/{threadId}/{messageId}/{uuid}-{имя}.
 * Если запись файла не удалась, сообщение удаляется.
 * @param params - Текст и файлы
 * @returns Сообщение с вложениями
 */
export async function saveSupportMessageWithFiles(
  params: SaveSupportMessageParams,
): Promise<SupportMessageDto> {
  const images = await readImages(params.files);
  const message = await addSupportMessage({
    threadId: params.threadId,
    sender: params.sender,
    text: params.text,
    context: params.context ?? null,
  });

  const backend = getStorageRegistry().getActiveBackend();
  const storedKeys: string[] = [];
  try {
    const rows: InsertSupportAttachment[] = [];
    for (const image of images) {
      const key = `support/${params.threadId}/${message.id}/${randomUUID()}-${image.name}`;
      const stored = await backend.put(key, image.buffer, image.mime);
      storedKeys.push(stored.key);
      rows.push({
        messageId: message.id,
        fileName: image.name,
        mime: image.mime,
        size: image.buffer.length,
        storageConfigId: stored.configId,
        storageKey: stored.key,
      });
    }
    const attachments = await insertSupportAttachments(rows);
    return toSupportMessageDto(message, attachments);
  } catch (err) {
    await db.delete(supportMessages).where(eq(supportMessages.id, message.id));
    await Promise.all(storedKeys.map((key) => backend.delete(key).catch(() => undefined)));
    throw err;
  }
}
