/**
 * @fileoverview Корневая панель вкладки «Агент» — управление токенами MCP
 *
 * Онбординг, кнопка создания, таблица токенов и диалоги создания/показа/отзыва.
 *
 * @module editor/agent/AgentTokensPanel
 */

import { useState } from "react";
import { Bot, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAgentTokens } from "./use-agent-tokens";
import { AgentTokensTable } from "./AgentTokensTable";
import { CreateTokenDialog } from "./CreateTokenDialog";
import { RevealTokenDialog } from "./RevealTokenDialog";
import { RevokeTokenAlert } from "./RevokeTokenAlert";
import type { AgentTokenDto } from "./agent-token-types";

/**
 * Панель управления персональными токенами агента (MCP).
 * @returns JSX элемент
 */
export function AgentTokensPanel() {
  const { data: tokens, isLoading, isError } = useAgentTokens();
  const [createOpen, setCreateOpen] = useState(false);
  const [revealToken, setRevealToken] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<AgentTokenDto | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Агент</h2>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">
            Подключи ИИ-агента (Kiro / Cursor) к своим проектам. Агент сможет создавать и
            редактировать ботов в реальном времени прямо на холсте через MCP.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Создать токен
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Загрузка токенов…</p>}
      {isError && <p className="text-sm text-destructive">Не удалось загрузить токены.</p>}
      {!isLoading && !isError && (
        <AgentTokensTable tokens={tokens ?? []} onRevoke={setRevokeTarget} />
      )}

      <CreateTokenDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={setRevealToken}
      />
      <RevealTokenDialog token={revealToken} onClose={() => setRevealToken(null)} />
      <RevokeTokenAlert token={revokeTarget} onClose={() => setRevokeTarget(null)} />
    </div>
  );
}
