import { jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
function isBotCardTarget(projectId, tokenId) {
  return window.location.hash === `#bot-${projectId}-${tokenId}`;
}
function BotCardAnchor({ projectId, tokenId, children }) {
  const root = useRef(null);
  useEffect(() => {
    if (!isBotCardTarget(projectId, tokenId)) return;
    const frame = requestAnimationFrame(() => root.current?.scrollIntoView({ block: "start", behavior: "instant" }));
    return () => cancelAnimationFrame(frame);
  }, [projectId, tokenId]);
  return /* @__PURE__ */ jsx("div", { ref: root, id: `bot-${projectId}-${tokenId}`, className: "min-w-0 scroll-mt-4", children });
}
export {
  BotCardAnchor,
  isBotCardTarget
};
