/**
 * @fileoverview Последовательная загрузка файла в S3 частями с ограничением памяти.
 */
import { open } from 'node:fs/promises';
import {
  S3Client, CreateMultipartUploadCommand, UploadPartCommand,
  CompleteMultipartUploadCommand, AbortMultipartUploadCommand, PutObjectCommand,
} from '@aws-sdk/client-s3';

/** Размер части: в памяти одновременно находится только одна такая часть. */
export const S3_FILE_PART_BYTES = 8 * 1024 * 1024;

/**
 * Передаёт файл в S3, отменяя незавершённую загрузку при любой ошибке.
 * @param client - Клиент выбранного хранилища
 * @param bucket - Имя бакета
 * @param key - Ключ назначения
 * @param filePath - Локальный исходный файл
 * @param mime - MIME-тип объекта
 * @returns Размер переданного файла
 */
export async function uploadS3File(client: S3Client, bucket: string, key: string, filePath: string, mime: string): Promise<number> {
  const file = await open(filePath, 'r');
  let uploadId: string | undefined;
  try {
    const { size } = await file.stat();
    if (size === 0) {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: Buffer.alloc(0), ContentType: mime }));
      return 0;
    }
    const partBytes = Math.max(S3_FILE_PART_BYTES, Math.ceil(size / 10000));
    const created = await client.send(new CreateMultipartUploadCommand({ Bucket: bucket, Key: key, ContentType: mime }));
    uploadId = created.UploadId;
    if (!uploadId) throw new Error('S3 не вернул идентификатор загрузки');
    const parts: { ETag: string; PartNumber: number }[] = [];
    const buffer = Buffer.allocUnsafe(partBytes);
    let offset = 0;
    while (offset < size) {
      const length = Math.min(partBytes, size - offset);
      let filled = 0;
      while (filled < length) {
        const { bytesRead } = await file.read(buffer, filled, length - filled, offset + filled);
        if (!bytesRead) throw new Error('Исходный файл изменился во время загрузки');
        filled += bytesRead;
      }
      const part = await client.send(new UploadPartCommand({
        Bucket: bucket, Key: key, UploadId: uploadId, PartNumber: parts.length + 1,
        Body: buffer.subarray(0, length), ContentLength: length,
      }));
      if (!part.ETag) throw new Error('S3 не подтвердил загруженную часть');
      parts.push({ ETag: part.ETag, PartNumber: parts.length + 1 });
      offset += length;
    }
    await client.send(new CompleteMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId, MultipartUpload: { Parts: parts } }));
    uploadId = undefined;
    return size;
  } catch (error) {
    if (uploadId) {
      await client.send(new AbortMultipartUploadCommand({ Bucket: bucket, Key: key, UploadId: uploadId })).catch(() => undefined);
    }
    throw error;
  } finally {
    await file.close();
  }
}
