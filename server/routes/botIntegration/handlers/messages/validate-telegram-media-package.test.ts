/**
 * @fileoverview Проверки запрета отправки пакетов с молчаливой потерей вложений.
 */
import { describe, expect, it } from 'vitest';
import type { SendMediaFile } from './extract-media';
import { validateTelegramMediaPackage } from './validate-telegram-media-package';

/**
 * Создаёт вложение для проверки состава альбома.
 * @param type - Тип вложения
 * @returns Вложение с фиктивным идентификатором Telegram
 */
function media(type: SendMediaFile['type']): SendMediaFile {
  return { id: 1, type, url: 'test-file-id' };
}

describe('Пакет медиа Telegram', () => {
  it('сохраняет текст и одиночное вложение с кнопками допустимыми', () => {
    expect(() => validateTelegramMediaPackage([], true)).not.toThrow();
    expect(() => validateTelegramMediaPackage([media('photo')], true)).not.toThrow();
  });

  it('отклоняет несколько вложений с кнопками вместо отправки только первого', () => {
    expect(() => validateTelegramMediaPackage([media('photo'), media('video')], true))
      .toThrow('Оставьте одно вложение или уберите кнопки');
  });

  it('разрешает альбом фото и видео без кнопок', () => {
    expect(() => validateTelegramMediaPackage([media('photo'), media('video')])).not.toThrow();
  });

  it('разрешает однородные альбомы документов и аудио', () => {
    for (const type of ['document', 'audio'] as const) {
      expect(() => validateTelegramMediaPackage([media(type), media(type)])).not.toThrow();
    }
  });

  it('не обрезает альбом до десяти файлов', () => {
    expect(() => validateTelegramMediaPackage(Array.from({ length: 11 }, () => media('photo'))))
      .toThrow('не более 10');
  });

  it('не удаляет неподдерживаемые элементы и запрещает смешанные документы', () => {
    expect(() => validateTelegramMediaPackage([media('photo'), media('voice')]))
      .toThrow('поддерживает только');
    expect(() => validateTelegramMediaPackage([media('photo'), media('document')]))
      .toThrow('одного типа');
  });
});
