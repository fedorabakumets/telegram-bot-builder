/** @fileoverview Запуск production frontend с отдельным backend и одним публичным адресом. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFrontendServer } from './server.mjs';
/** Настройки читаются только сервером и не попадают в клиентскую сборку. */
const backendUrl = process.env.BACKEND_URL;
if (!backendUrl) throw new Error('Укажите BACKEND_URL для отдельного frontend');
const port = Number(process.env.FRONTEND_PORT || process.env.PORT || 5173);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Некорректный порт frontend');
const server = createFrontendServer({ backendUrl, distPath: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist') });
server.listen(port, process.env.HOST || '0.0.0.0', () => console.log(`Frontend слушает порт ${port}`));
/** Завершает приём соединений при остановке контейнера. */
function shutdown() { server.close(); setTimeout(() => process.exit(0), 10000).unref(); }
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
