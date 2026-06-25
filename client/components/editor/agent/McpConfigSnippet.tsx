/**
 * @fileoverview Готовый сниппет конфигурации MCP с подставленным токеном
 *
 * Показывает JSON для mcp.json с реальными значениями токена и базового URL,
 * даёт кнопку копирования всего конфига.
 *
 * @module editor/agent/McpConfigSnippet
 */

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

/** Свойства сниппета конфигурации MCP */
export interface McpConfigSnippetProps {
  /** Полный секрет токена для подстановки */
  token: string;
}

/**
 * Формирует JSON-конфиг MCP-сервера с подставленными значениями.
 * @param token - Полный секрет токена
 * @returns Строка JSON-конфига
 */
function buildConfig(token: string): string {
  const apiBaseUrl = typeof window !== "undefined" ? window.location.origin : "https://<домен>";
  return JSON.stringify(
    {
      mcpServers: {
        "botcraft-builder": {
          command: "npm",
          args: ["run", "mcp:bot-builder"],
          cwd: "<путь к каталогу проекта>",
          env: {
            API_BASE_URL: apiBaseUrl,
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
 * Блок с готовым конфигом MCP и кнопкой копирования.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function McpConfigSnippet({ token }: McpConfigSnippetProps) {
  const { toast } = useToast();
  const config = buildConfig(token);

  /** Копирует конфиг в буфер обмена */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    toast({ title: "Скопировано", description: "Конфиг MCP в буфере обмена" });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Конфиг для mcp.json (Kiro / Cursor)</p>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-1" />
          Копировать конфиг
        </Button>
      </div>
      <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs font-mono">
        {config}
      </pre>
    </div>
  );
}
