/** @fileoverview Совместный dev-запуск API, frontend, runtime и единственного Telethon-брокера. */
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { createDevServicePlan } from './dev-service-plan.mjs';
import { startDevProcessGroup } from './dev-process-group.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
config({ path: resolve(root, '.env'), quiet: true });
const selected = process.argv[2];
const services = createDevServicePlan(process.env, root).filter(service => !selected || service.name === selected);
if (!services.length) throw new Error('Неизвестный сервис разработки');
if (services.some(service => service.name === 'broker')) {
  if (Buffer.byteLength(process.env.TELETHON_BROKER_SECRET?.trim() || '') < 32) {
    throw new Error('Для брокера задайте TELETHON_BROKER_SECRET длиной не менее 32 байт');
  }
  mkdirSync(dirname(services[0].env.TELETHON_BROKER_LOCK_FILE), { recursive: true });
}
const { stop } = startDevProcessGroup({ services, root });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
/** Позволяет локальному управляющему процессу штатно закрыть собственную группу. */
process.on('message', message => {
  if (message?.type === 'shutdown') {
    stop(0);
    if (process.connected) process.disconnect();
  }
});
