/**
 * @fileoverview Старт stdio MCP из любой рабочей папки Cursor.
 * Общий процесс MCP не применяет cwd, поэтому каталог конструктора
 * выставляется до загрузки сервера и dotenv.
 */

import { chdir } from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '../..');

chdir(projectRoot);
await import(pathToFileURL(path.join(projectRoot, 'tools/mcp-server/index.ts')).href);
