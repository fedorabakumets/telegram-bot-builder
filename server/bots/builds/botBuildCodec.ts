/**
 * @fileoverview Упаковка кода сборки: gzip + контроль целостности sha256
 * @module server/bots/builds/botBuildCodec
 */

import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";

/** Упакованная сборка */
export interface PackedBotBuild {
  /** Сжатое содержимое для записи в хранилище */
  data: Buffer;
  /** Размер несжатого кода в байтах */
  size: number;
  /** sha256 несжатого кода (hex) */
  sha256: string;
}

/**
 * Считает sha256 буфера.
 * @param data - Данные
 * @returns hex-строка
 */
export function sha256Hex(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Сжимает код сборки.
 * @param code - Несжатый код бота
 * @returns Сжатые данные, размер и хэш
 */
export function packBotBuild(code: Buffer): PackedBotBuild {
  return { data: gzipSync(code, { level: 6 }), size: code.length, sha256: sha256Hex(code) };
}

/**
 * Распаковывает сборку и проверяет её целостность.
 * @param data - Сжатые данные из хранилища
 * @param expected - Ожидаемые размер и sha256
 * @returns Несжатый код
 * @throws Если размер или хэш не совпали
 */
export function unpackBotBuild(data: Buffer, expected: { size: number; sha256: string }): Buffer {
  const code = gunzipSync(data);
  if (code.length !== expected.size || sha256Hex(code) !== expected.sha256) {
    throw new Error("Сборка повреждена: размер или sha256 не совпадают");
  }
  return code;
}

/**
 * Читает поток целиком в буфер.
 * @param stream - Читаемый поток
 * @returns Содержимое потока
 */
export async function readStreamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
