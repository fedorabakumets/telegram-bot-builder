/** @fileoverview Проверка фотографий блока: ссылки, Telegram-токены и исключение посторонних медиа. */
import { describe, it, expect } from 'vitest';
import { getNodePhotoFiles } from '../panel/node-photo-files';

describe('Фотографии выбранного блока', () => {
  it('объединяет attachedMedia и imageUrl без повторов', () => {
    const files = getNodePhotoFiles({ attachedMedia: ['/uploads/a.jpg', '/uploads/a.jpg', '/uploads/b.png?x=1'], imageUrl: '/uploads/a.jpg' });
    expect(files.map(file => file.url)).toEqual(['/uploads/a.jpg', '/uploads/b.png?x=1']);
  });
  it('исключает видео, документы, переменные и повреждённый JSON', () => {
    expect(getNodePhotoFiles({ attachedMedia: ['/uploads/a.mp4', '/uploads/a.pdf', '{photo}', '{broken', null] })).toEqual([]);
  });
  it('использует предпочтительный токен и запасной доступный токен', () => {
    const data = { attachedMedia: [JSON.stringify({ __type: 'file_id', mediaType: 'photo', fileIdsByToken: { 5: 'a', 9: 'b' } })] };
    expect(getNodePhotoFiles(data, 9)[0]).toMatchObject({ fileId: 'b', tokenId: 9, url: null });
    expect(getNodePhotoFiles(data, 20)[0]).toMatchObject({ fileId: 'a', tokenId: 5 });
  });
  it('не показывает Telegram-видео и фото без подходящего file_id', () => {
    const attachedMedia = [{ __type: 'file_id', mediaType: 'video', fileIdsByToken: { 5: 'v' } },
      { __type: 'file_id', mediaType: 'photo', fileIdsByToken: {} }].map(value => JSON.stringify(value));
    expect(getNodePhotoFiles({ attachedMedia })).toEqual([]);
  });
  it('принимает imageUrl без расширения, но исключает исполняемые URL', () => {
    expect(getNodePhotoFiles({ imageUrl: 'https://example.org/photo' })).toHaveLength(1);
    expect(getNodePhotoFiles({ imageUrl: 'javascript:alert(1)' })).toEqual([]);
  });
});
