import { jsx } from "react/jsx-runtime";
import { BotCard } from "../card/BotCard";
import { BotCardAnchor, isBotCardTarget } from "./BotCardAnchor";
import { useBotControl } from "../bot-control-context";
function ProjectBotsList({
  project,
  projectTokens,
  projectBotInfo,
  collapsedState,
  onCollapseChange
}) {
  const { allBotStatuses } = useBotControl();
  const defaultCollapsedFallback = projectTokens.length > 3;
  return /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: projectTokens.map((token) => {
    const tokenStatus = allBotStatuses.find(
      (s) => s.tokenId === token.id || s.instance?.tokenId === token.id
    );
    const isThisTokenRunning = tokenStatus?.status === "running";
    const defaultCollapsed = collapsedState ? collapsedState[token.id] ?? defaultCollapsedFallback : defaultCollapsedFallback;
    return /* @__PURE__ */ jsx(BotCardAnchor, { projectId: project.id, tokenId: token.id, children: /* @__PURE__ */ jsx(
      BotCard,
      {
        token,
        project,
        projectBotInfo,
        isThisTokenRunning,
        defaultCollapsed: isBotCardTarget(project.id, token.id) ? false : defaultCollapsed,
        onCollapseChange: (collapsed) => onCollapseChange?.(token.id, collapsed)
      }
    ) }, token.id);
  }) });
}
export {
  ProjectBotsList
};
