/**
 * @fileoverview Сравнение ключа входа в админку за постоянное время
 * @module server/admin/admin-key-match
 */

import crypto from "crypto";

/**
 * Сравнивает введённый ключ с ожидаемым за постоянное время.
 * SHA-256 обеих строк всегда одной длины, поэтому timingSafeEqual
 * не падает на коротком или пустом вводе. Пустая строка и другой ключ не совпадают.
 * @param submitted - Введённый ключ
 * @param expected - Ожидаемый ключ (ADMIN_API_KEY)
 * @returns true, если строки совпадают
 */
export function adminKeysMatch(submitted: string, expected: string): boolean {
  const submittedHash = crypto.createHash("sha256").update(submitted, "utf8").digest();
  const expectedHash = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(submittedHash, expectedHash);
}
