import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { BotsCanvas } from "./BotsCanvas";
import { BotDetailPanel } from "./BotDetailPanel";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useMediaQuery } from "@/components/editor/properties/hooks/use-media-query";
import { useBotControl } from "../bot-control-context";
import { useBotDetailPanelWidth } from "./use-bot-detail-panel-width";
import { buildFailureByTokenId } from "./bot-service-failure";
function BotsCanvasWorkspace({ project, tokens }) {
  const { allBotStatuses } = useBotControl();
  const useSheet = useMediaQuery("(max-width: 639px)");
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const { width: panelWidth, onResizePointerDown } = useBotDetailPanelWidth();
  useEffect(() => {
    const requested = Number(new URLSearchParams(window.location.search).get("bot"));
    setSelectedTokenId(Number.isSafeInteger(requested) && requested > 0 ? requested : null);
  }, [project.id]);
  const runningByTokenId = useMemo(() => {
    const map = {};
    for (const s of allBotStatuses) {
      const id = s.tokenId ?? s.instance?.tokenId;
      if (id != null) map[id] = s.status === "running";
    }
    return map;
  }, [allBotStatuses]);
  const failureByTokenId = useMemo(
    () => buildFailureByTokenId(allBotStatuses),
    [allBotStatuses]
  );
  const selectedToken = tokens.find((t) => t.id === selectedTokenId) ?? null;
  const overlayOpen = !!selectedToken && !useSheet;
  return /* @__PURE__ */ jsxs("div", { className: "relative h-full min-h-0 overflow-hidden", children: [
    /* @__PURE__ */ jsx(
      BotsCanvas,
      {
        projectId: project.id,
        tokens,
        runningByTokenId,
        failureByTokenId,
        selectedTokenId,
        onSelectToken: setSelectedTokenId,
        overlayPanelWidth: overlayOpen ? panelWidth : 0
      }
    ),
    overlayOpen && selectedToken && /* @__PURE__ */ jsxs(
      "aside",
      {
        className: [
          "absolute inset-y-0 right-0 z-20 flex flex-col",
          "border-l border-border bg-background",
          "shadow-[-10px_0_28px_rgba(0,0,0,0.16)] dark:shadow-[-10px_0_32px_rgba(0,0,0,0.38)]",
          "animate-in slide-in-from-right duration-200"
        ].join(" "),
        style: { width: panelWidth },
        "data-bot-detail-overlay": "true",
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              role: "separator",
              "aria-orientation": "vertical",
              "aria-label": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0448\u0438\u0440\u0438\u043D\u0443 \u043F\u0430\u043D\u0435\u043B\u0438",
              title: "\u041F\u043E\u0442\u044F\u043D\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0448\u0438\u0440\u0438\u043D\u0443",
              onPointerDown: onResizePointerDown,
              className: [
                "group/resize absolute inset-y-0 left-0 z-30 w-3 -translate-x-1/2",
                "cursor-col-resize touch-none",
                "flex items-center justify-center"
              ].join(" "),
              children: /* @__PURE__ */ jsx("span", { className: "h-10 w-1 rounded-full bg-blue-500/25 transition-colors group-hover/resize:bg-blue-500/70 group-active/resize:bg-blue-500" })
            }
          ),
          /* @__PURE__ */ jsx(
            BotDetailPanel,
            {
              project,
              token: selectedToken,
              isRunning: !!runningByTokenId[selectedToken.id],
              onClose: () => setSelectedTokenId(null)
            }
          )
        ]
      }
    ),
    useSheet && /* @__PURE__ */ jsx(
      Sheet,
      {
        open: !!selectedToken,
        onOpenChange: (open) => {
          if (!open) setSelectedTokenId(null);
        },
        children: /* @__PURE__ */ jsx(
          SheetContent,
          {
            side: "bottom",
            className: "top-2 h-auto max-h-none gap-0 overflow-hidden rounded-t-xl p-0 flex flex-col",
            hideClose: true,
            children: selectedToken && /* @__PURE__ */ jsx(
              BotDetailPanel,
              {
                project,
                token: selectedToken,
                isRunning: !!runningByTokenId[selectedToken.id],
                onClose: () => setSelectedTokenId(null),
                compact: true
              }
            )
          }
        )
      }
    )
  ] });
}
export {
  BotsCanvasWorkspace
};
