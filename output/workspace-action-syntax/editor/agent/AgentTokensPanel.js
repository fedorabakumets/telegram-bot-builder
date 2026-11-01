import { jsx, jsxs } from "react/jsx-runtime";
import { AgentConnections } from "./AgentConnections";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import "./agent-page.css";
import { WorkspaceActionButton } from "@/components/ui/workspace-action-button";
import { WorkspaceTabHeading } from "@/components/ui/workspace-tab-heading";
import { useAgentTokens } from "./use-agent-tokens";
import { AgentTokensTable } from "./AgentTokensTable";
import { CreateTokenDialog } from "./CreateTokenDialog";
import { RevealTokenDialog } from "./RevealTokenDialog";
import { RevokeTokenAlert } from "./RevokeTokenAlert";
function AgentTokensPanel() {
  const { data: tokens, isLoading, isError } = useAgentTokens();
  const [createOpen, setCreateOpen] = useState(false);
  const [revealToken, setRevealToken] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  return /* @__PURE__ */ jsxs("div", { className: "agent-page mx-auto w-full max-w-5xl space-y-6 pb-4", children: [
    /* @__PURE__ */ jsx(
      WorkspaceTabHeading,
      {
        title: "\u0410\u0433\u0435\u043D\u0442",
        icon: /* @__PURE__ */ jsx(Sparkles, {}),
        description: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 Telegram Agent \u043A \u0441\u0432\u043E\u0435\u043C\u0443 \u043F\u0440\u043E\u0444\u0438\u043B\u044E, \u0447\u0442\u043E\u0431\u044B \u0440\u0430\u0431\u043E\u0442\u0430\u0442\u044C \u0441 \u0431\u043E\u0442\u0430\u043C\u0438 \u0432 \u043F\u0435\u0440\u0435\u043F\u0438\u0441\u043A\u0435."
      }
    ),
    /* @__PURE__ */ jsx(AgentConnections, {}),
    /* @__PURE__ */ jsxs("section", { "aria-labelledby": "agent-tokens-heading", className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-1", children: [
          /* @__PURE__ */ jsx("h3", { id: "agent-tokens-heading", className: "text-xl font-semibold", children: "\u0414\u0440\u0443\u0433\u0438\u0435 \u0418\u0418 \u043A\u043B\u0438\u0435\u043D\u0442\u044B" }),
          /* @__PURE__ */ jsx("p", { className: "max-w-xl text-pretty text-sm text-muted-foreground", children: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u0442\u043E\u043A\u0435\u043D \u0434\u043B\u044F \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0447\u0435\u0440\u0435\u0437 MCP." })
        ] }),
        /* @__PURE__ */ jsxs(WorkspaceActionButton, { className: "agent-action px-3 text-sm font-semibold", onClick: () => setCreateOpen(true), children: [
          /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\uFF0B" }),
          " \u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D"
        ] })
      ] }),
      isLoading && /* @__PURE__ */ jsx("div", { role: "status", className: "agent-skeleton h-32 rounded-xl bg-muted", children: /* @__PURE__ */ jsx("span", { className: "sr-only", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0442\u043E\u043A\u0435\u043D\u043E\u0432\u2026" }) }),
      isError && /* @__PURE__ */ jsx("p", { role: "alert", className: "rounded-lg border border-destructive/30 p-4 text-sm text-destructive", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0442\u043E\u043A\u0435\u043D\u044B. \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u043F\u043E\u043F\u044B\u0442\u043A\u0443." }),
      !isLoading && !isError && /* @__PURE__ */ jsx(AgentTokensTable, { tokens: tokens ?? [], onRevoke: setRevokeTarget })
    ] }),
    /* @__PURE__ */ jsx(
      CreateTokenDialog,
      {
        open: createOpen,
        onOpenChange: setCreateOpen,
        onCreated: setRevealToken
      }
    ),
    /* @__PURE__ */ jsx(RevealTokenDialog, { token: revealToken, onClose: () => setRevealToken(null) }),
    /* @__PURE__ */ jsx(RevokeTokenAlert, { token: revokeTarget, onClose: () => setRevokeTarget(null) })
  ] });
}
export {
  AgentTokensPanel
};
