/** @fileoverview Проверка немедленного обновления размеров с изоляцией проекта, источника и file_id. */
import { QueryClient } from '@tanstack/react-query';
import { describe, it, expect } from 'vitest';
import { updateFileSizeCache } from '../panel/table/file-size-cache';
import type { ProjectFile } from '../hooks/use-project-files';

describe('Обновление размера без перезагрузки', () => {
  it('обновляет загруженные страницы и сохраняет пагинацию', () => {
    const client = new QueryClient();
    const file = { id: 10, source: 'outgoing', fileId: 'photo', fileSize: null } as ProjectFile;
    const key = ['/api/projects', 13, 'files', 'page=1'];
    client.setQueryData(key, { files: [file], total: 100 });
    client.setQueryData(['/api/projects', 13, 'files', 'page=2'], { files: [file] });
    updateFileSizeCache(client, 13, file, 186749);
    expect(client.getQueryData(key)).toMatchObject({ files: [{ fileSize: 186749 }], total: 100 });
    expect(client.getQueryData(['/api/projects', 13, 'files', 'page=2'])).toMatchObject({ files: [{ fileSize: 186749 }] });
    client.clear();
  });
  it('не меняет другой проект, загрузку с тем же ID и другой Telegram-файл', () => {
    const client = new QueryClient();
    const file = { id: 10, source: 'outgoing', fileId: 'photo', fileSize: null } as ProjectFile;
    const key = ['/api/projects', 13, 'files'];
    client.setQueryData(key, { files: [{ ...file, source: 'uploaded' }, { ...file, fileId: 'other' }] });
    client.setQueryData(['/api/projects', 12, 'files'], { files: [file] });
    updateFileSizeCache(client, 13, file, 186749);
    expect(client.getQueryData(key)).toMatchObject({ files: [{ fileSize: null }, { fileSize: null }] });
    expect(client.getQueryData(['/api/projects', 12, 'files'])).toMatchObject({ files: [{ fileSize: null }] });
    updateFileSizeCache(client, 13, file, -1);
    expect(client.getQueryData(key)).toMatchObject({ files: [{ fileSize: null }, { fileSize: null }] });
    client.clear();
  });
});
