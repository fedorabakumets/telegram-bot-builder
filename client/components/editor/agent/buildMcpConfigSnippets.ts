/**
 * @fileoverview Сборка текстов конфигов MCP для вкладки «Агент»
 * @module editor/agent/buildMcpConfigSnippets
 */

/**
 * Базовый URL приложения (origin вкладки или плейсхолдер).
 * @returns Origin или https://&lt;домен&gt;
 */
export function resolveApiOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "https://<домен>";
}

/**
 * Remote Streamable HTTP конфиг (Cursor / Claude Desktop).
 * @param token - PAT агента
 * @returns JSON-строка
 */
export function buildRemoteConfig(token: string): string {
  const origin = resolveApiOrigin();
  return JSON.stringify(
    {
      mcpServers: {
        "botcraft-builder": {
          url: `${origin}/mcp`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      },
    },
    null,
    2,
  );
}

/**
 * Локальный stdio-конфиг (нужен клон репо).
 * @param token - PAT агента
 * @returns JSON-строка
 */
export function buildStdioConfig(token: string): string {
  const origin = resolveApiOrigin();
  return JSON.stringify(
    {
      mcpServers: {
        "botcraft-builder": {
          command: "npm",
          args: ["run", "mcp:bot-builder"],
          cwd: "<путь к каталогу проекта>",
          env: {
            API_BASE_URL: origin,
            MCP_AGENT_TOKEN: token,
          },
        },
      },
    },
    null,
    2,
  );
}

/**
 * Фрагмент TOML для OpenAI Codex (~/.codex/config.toml).
 * @param token - PAT агента
 * @returns TOML-строка
 */
export function buildCodexToml(token: string): string {
  const origin = resolveApiOrigin();
  return [
    "[mcp_servers.botcraft-builder]",
    `url = "${origin}/mcp"`,
    'bearer_token_env_var = "MCP_AGENT_TOKEN"',
    "",
    `# export MCP_AGENT_TOKEN=${token.slice(0, 12)}…  (полный секрет — в env, не в git)`,
  ].join("\n");
}
