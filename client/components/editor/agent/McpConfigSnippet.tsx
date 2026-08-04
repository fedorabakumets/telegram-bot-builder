/**
 * @fileoverview Готовый сниппет конфигурации MCP с подставленным токеном
 * @module editor/agent/McpConfigSnippet
 */

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  buildCodexToml,
  buildRemoteConfig,
  buildStdioConfig,
} from "./buildMcpConfigSnippets";

/** Свойства сниппета конфигурации MCP */
export interface McpConfigSnippetProps {
  /** Полный секрет токена для подстановки */
  token: string;
}

type SnippetTab = "remote" | "stdio" | "codex";

/**
 * Блок с готовым конфигом MCP и кнопкой копирования.
 * @param props - Свойства компонента
 * @returns JSX элемент
 */
export function McpConfigSnippet({ token }: McpConfigSnippetProps) {
  const { toast } = useToast();
  const [tab, setTab] = useState<SnippetTab>("remote");

  const config =
    tab === "remote"
      ? buildRemoteConfig(token)
      : tab === "stdio"
        ? buildStdioConfig(token)
        : buildCodexToml(token);

  const label =
    tab === "remote"
      ? "Remote URL (Cursor / Claude) — без клона репо"
      : tab === "stdio"
        ? "Локально (stdio) — нужен клон репо"
        : "Codex (~/.codex/config.toml)";

  /** Копирует конфиг в буфер обмена */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(config);
    toast({ title: "Скопировано", description: "Конфиг MCP в буфере обмена" });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant={tab === "remote" ? "default" : "outline"} size="sm" onClick={() => setTab("remote")}>
          Remote URL
        </Button>
        <Button type="button" variant={tab === "stdio" ? "default" : "outline"} size="sm" onClick={() => setTab("stdio")}>
          Stdio
        </Button>
        <Button type="button" variant={tab === "codex" ? "default" : "outline"} size="sm" onClick={() => setTab("codex")}>
          Codex
        </Button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{label}</p>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-1" />
          Копировать
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Claude Code: добавьте <code className="text-xs">"type": "http"</code> рядом с{" "}
        <code className="text-xs">url</code> в JSON-конфиге.
      </p>
      <pre className="max-h-60 overflow-auto rounded-md bg-muted p-3 text-xs font-mono">{config}</pre>
    </div>
  );
}
