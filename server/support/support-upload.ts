/**
 * @fileoverview Приём картинок сообщения поддержки на диск, не больше 8 МБ каждая
 * @module server/support/support-upload
 */

import type { NextFunction, Request, Response } from "express";
import crypto from "crypto";
import multer from "multer";
import os from "os";
import { SUPPORT_IMAGE_MAX_BYTES } from "@shared/support/support-image";

/** Временные файлы. Число картинок в одном сообщении не ограничено */
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, os.tmpdir()),
    filename: (_req, _file, callback) => callback(null, `support-${crypto.randomUUID()}`),
  }),
  limits: { fileSize: SUPPORT_IMAGE_MAX_BYTES },
});

/**
 * Кладёт поле files в req.files. Слишком большой файл отвечает 400
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @param next - Следующий обработчик
 */
export function supportFilesUpload(req: Request, res: Response, next: NextFunction): void {
  upload.array("files")(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    const tooBig = err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE";
    res.status(400).json({ error: tooBig ? "Файл больше 8 МБ" : "Не удалось принять файлы" });
  });
}
