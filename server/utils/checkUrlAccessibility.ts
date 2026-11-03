/**
 * @fileoverview Проверка внешней ссылки с защитой от внутренних адресов.
 */
import { safeExternalRequest } from './safe-external-request';

/** Проверяет доступность внешнего ресурса.
 * @param url - Проверяемая ссылка
 * @returns Метаданные ресурса или ошибка
 */
export async function checkUrlAccessibility(url: string): Promise<{ accessible: boolean; mimeType?: string; size?: number; fileName?: string; error?: string }> {
  try {
    const result = await safeExternalRequest(url, 'HEAD');
    const response = result.response;
    response.resume();
    if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) return { accessible: false, error: `Ошибка сервера: ${response.statusCode}` };
    const disposition = response.headers['content-disposition'];
    const name = disposition?.match(/filename\s*=\s*"?([^";]+)/i)?.[1] || result.url.pathname.split('/').pop() || 'file';
    return { accessible: true, mimeType: response.headers['content-type'], size: Number(response.headers['content-length']) || undefined, fileName: name };
  } catch (error) { return { accessible: false, error: error instanceof Error ? error.message : 'Ошибка сети' }; }
}
