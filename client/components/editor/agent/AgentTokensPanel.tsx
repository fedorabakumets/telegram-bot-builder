/**
 * @fileoverview Корневая панель вкладки «Агент» — управление токенами MCP
 *
 * Онбординг, кнопка создания, таблица токенов и диалоги создания/показа/отзыва.
 *
 * @module editor/agent/AgentTokensPanel
 */

import { AgentConnections } from "./AgentConnections";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import "./agent-page.css";
import { Button } from "@/components/ui/button";
import { WorkspaceTabHeading } from "@/components/ui/workspace-tab-heading";
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
    <div className="agent-page mx-auto w-full max-w-5xl space-y-6 pb-4">
      <WorkspaceTabHeading title="Агент" icon={<Sparkles />}
        description="Подключите Telegram Agent к своему профилю, чтобы работать с ботами в переписке." />
      <AgentConnections />
      <section aria-labelledby="agent-tokens-heading" className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h3 id="agent-tokens-heading" className="text-xl font-semibold">Другие ИИ клиенты</h3>
            <p className="max-w-xl text-pretty text-sm text-muted-foreground">Создайте отдельный токен для подключения через MCP.</p>
          </div>
          <Button className="agent-action px-3 text-sm font-semibold" onClick={() => setCreateOpen(true)}>
            <span aria-hidden="true">＋</span> Создать токен
          </Button>
        </div>
        {isLoading && <div role="status" className="agent-skeleton h-32 rounded-xl bg-muted"><span className="sr-only">Загрузка токенов…</span></div>}
        {isError && <p role="alert" className="rounded-lg border border-destructive/30 p-4 text-sm text-destructive">Не удалось загрузить токены. Обновите страницу, чтобы повторить попытку.</p>}
        {!isLoading && !isError && <AgentTokensTable tokens={tokens ?? []} onRevoke={setRevokeTarget} />}
      </section>
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
