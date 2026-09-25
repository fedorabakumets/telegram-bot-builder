/**
 * @fileoverview Готовит урезанный OpenAPI для второго MCP (openapi-mcp-generator)
 * @description Берёт docs/api/openapi.json, оставляет только выбранные теги,
 * добавляет servers и x-mcp. Запуск: node tools/mcp-openapi/prepare-spec.mjs
 * @module tools/mcp-openapi/prepare-spec
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../..');

/** Теги, которые экспонируем как MCP-тулы (остальное — дубли botcraft / админка) */
const INCLUDE_TAGS = new Set([
  'project-tokens',
  'project-bot',
  'projects',
  'agent-tokens',
  'health',
  'bots',
  'tokens',
]);

/**
 * Операция относится к whitelist-тегу
 * @param {unknown} op - OpenAPI operation object
 * @returns {boolean}
 */
function opIncluded(op) {
  if (!op || typeof op !== 'object') return false;
  const tags = /** @type {{ tags?: string[] }} */ (op).tags;
  if (!Array.isArray(tags) || tags.length === 0) return false;
  return tags.some((t) => INCLUDE_TAGS.has(t));
}

/**
 * Собирает filtered OpenAPI и пишет openapi.mcp.json
 * @returns {void}
 */
function main() {
  const srcPath = path.join(root, 'docs/api/openapi.json');
  const outPath = path.join(__dirname, 'openapi.mcp.json');
  const doc = JSON.parse(fs.readFileSync(srcPath, 'utf8'));

  /** @type {Record<string, Record<string, unknown>>} */
  const paths = {};
  let keptOps = 0;

  for (const [p, methods] of Object.entries(doc.paths || {})) {
    /** @type {Record<string, unknown>} */
    const kept = {};
    for (const [method, op] of Object.entries(methods || {})) {
      if (method.startsWith('x-')) {
        kept[method] = op;
        continue;
      }
      if (opIncluded(op)) {
        kept[method] = op;
        keptOps += 1;
      }
    }
    const hasOp = Object.keys(kept).some((k) => !k.startsWith('x-'));
    if (hasOp) paths[p] = kept;
  }

  const filtered = {
    ...doc,
    info: {
      ...doc.info,
      title: `${doc.info?.title || 'API'} (MCP subset)`,
      description:
        (doc.info?.description || '') +
        '\n\nУрезанный spec для tools/mcp-openapi: теги ' +
        [...INCLUDE_TAGS].join(', ') +
        '.',
    },
    servers: [{ url: process.env.API_BASE_URL || 'http://localhost:5000' }],
    'x-mcp': true,
    paths,
    tags: (doc.tags || []).filter((t) => INCLUDE_TAGS.has(t.name)),
  };

  // Убираем adminCookie из securitySchemes — MCP ходит только с Bearer PAT
  if (filtered.components?.securitySchemes) {
    const { adminCookie: _a, cookieAuth: _c, ...rest } = filtered.components.securitySchemes;
    filtered.components.securitySchemes = {
      agentToken: rest.agentToken ?? doc.components.securitySchemes.agentToken,
    };
  }
  filtered.security = [{ agentToken: [] }];

  fs.writeFileSync(outPath, JSON.stringify(filtered, null, 2), 'utf8');
  console.log(
    `openapi.mcp.json: ${Object.keys(paths).length} paths, ${keptOps} ops → ${outPath}`,
  );
}

main();
