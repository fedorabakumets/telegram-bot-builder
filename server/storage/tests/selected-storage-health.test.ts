/**
 * @fileoverview Проверка сетевой доступности выбранного S3 и кэширования.
 * @module server/storage/tests/selected-storage-health.test
 */
import { describe, expect, it, vi } from "vitest";
import { S3Client, HeadBucketCommand } from "@aws-sdk/client-s3";
import { S3Backend } from "../s3-backend";
import { ensureSelectedStorageAvailable } from "../selected-storage-health";

/**
 * Создаёт S3 для тестовой проверки без настоящих секретов.
 * @returns Тестовый бэкенд
 */
function backend(): S3Backend {
  return new S3Backend({ configId: "test", name: "Тест", readOnly: false,
    s3: { region: "test", bucket: "test", forcePathStyle: true },
    credentials: { accessKeyId: "test", secretAccessKey: "test" } });
}

describe("Проверка выбранного S3", () => {
  it("объединяет запросы и кратко кэширует успешную проверку бакета", async () => {
    const send = vi.spyOn(S3Client.prototype, "send").mockResolvedValue({} as never);
    const store = backend();
    await Promise.all([ensureSelectedStorageAvailable(store), ensureSelectedStorageAvailable(store)]);
    await ensureSelectedStorageAvailable(store);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0]).toBeInstanceOf(HeadBucketCommand);
    send.mockRestore();
  });
  it("возвращает понятную ошибку при сетевом сбое и повторяет проверку", async () => {
    const send = vi.spyOn(S3Client.prototype, "send").mockRejectedValue(new Error("secret endpoint") as never);
    const store = backend();
    await expect(ensureSelectedStorageAvailable(store)).rejects.toThrow("Выбранное S3-хранилище недоступно");
    await expect(ensureSelectedStorageAvailable(store)).rejects.toThrow("Выбранное S3-хранилище недоступно");
    expect(send).toHaveBeenCalledTimes(2);
    send.mockRestore();
  });
});
