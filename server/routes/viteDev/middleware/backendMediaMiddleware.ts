/** @fileoverview Выдача исторических медиа без подключения клиентского интерфейса. */
import express, { type Express } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { appPath } from '../../../utils/app-root';
import { createRegisteredUploadsFallback } from '../../media/registered-uploads-fallback';

/** Подключает медиа после серверных проверок доступа, без SPA и клиентской статики.
 * @param app - Приложение с уже зарегистрированными API и авторизацией uploads
 */
export function serveBackendMedia(app: Express): void {
  app.use('/uploads', createRegisteredUploadsFallback());
  const uploadsPath = appPath('uploads');
  if (fs.existsSync(uploadsPath)) app.use('/uploads', express.static(uploadsPath));
  const assetsPath = appPath('assets');
  if (fs.existsSync(assetsPath)) app.use('/assets', express.static(assetsPath));
  const botsPath = appPath('bots');
  if (!fs.existsSync(botsPath)) return;
  for (const project of fs.readdirSync(botsPath)) {
    const match = project.match(/_(\d+)_(\d+)$/);
    const projectUploadsPath = path.join(botsPath, project, 'uploads');
    if (match && fs.existsSync(projectUploadsPath)) {
      app.use(`/uploads/${match[1]}`, express.static(projectUploadsPath));
    }
  }
}
