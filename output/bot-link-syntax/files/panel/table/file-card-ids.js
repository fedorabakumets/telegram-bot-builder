import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { Bot, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { buildOrderedEntries } from "./cell-file-ids";
import { buildBotPanelHref } from "./bot-panel-link";
function cleanLabel(label) {
  const seen = /* @__PURE__ */ new Set();
  return label.replace(/\s*\(@[^)]+\)/g, (match) => {
    const normalized = match.trim().toLowerCase();
    if (seen.has(normalized)) return "";
    seen.add(normalized);
    return match;
  }).trim();
}
function FileCardIds({ file, labels, selectedTokenId, projectId }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(null);
  const [error, setError] = useState(false);
  const resetTimer = useRef(null);
  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);
  const entries = buildOrderedEntries(file, selectedTokenId);
  const visible = expanded ? entries : entries.slice(0, 3);
  async function copy(id) {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(id);
      setError(false);
      if (resetTimer.current) clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => {
        setCopied(null);
        resetTimer.current = null;
      }, 2e3);
    } catch {
      setError(true);
    }
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsx("ul", { className: "space-y-3", children: visible.map((entry) => {
      const label = cleanLabel(entry.tokenId == null ? "\u041E\u0431\u0449\u0438\u0439 ID \u043F\u0440\u043E\u0435\u043A\u0442\u0430" : labels[String(entry.tokenId)] ?? `\u0411\u043E\u0442 #${entry.tokenId}`);
      const href = entry.tokenId != null ? buildBotPanelHref(projectId, entry.tokenId, window.location.search) : null;
      return /* @__PURE__ */ jsxs("li", { className: "grid min-w-0 grid-cols-[minmax(0,1fr)_32px] items-center gap-x-3 gap-y-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "contents", children: [
          /* @__PURE__ */ jsxs("p", { className: "col-start-1 row-start-1 flex min-w-0 items-center gap-2 text-sm", children: [
            /* @__PURE__ */ jsx(Bot, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
            href ? /* @__PURE__ */ jsx("a", { className: "truncate rounded-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", href, title: `\u041E\u0442\u043A\u0440\u044B\u0442\u044C ${label} \u0432 \u043A\u043E\u043D\u0441\u0442\u0440\u0443\u043A\u0442\u043E\u0440\u0435`, children: label }) : /* @__PURE__ */ jsx("span", { className: "truncate", title: label, children: label })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "files-id-value col-start-1 row-start-2 block w-full min-w-0 truncate rounded-sm text-left font-mono text-xs text-foreground/80 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
              onClick: () => copy(entry.fileId),
              "aria-label": `\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 Telegram ID: ${label}`,
              title: copied === entry.fileId ? "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E" : `\u041D\u0430\u0436\u043C\u0438\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C: ${entry.fileId}`,
              children: entry.fileId
            }
          )
        ] }),
        /* @__PURE__ */ jsx("button", { type: "button", className: "files-copy-id col-start-2 row-start-2 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", onClick: () => copy(entry.fileId), "aria-label": `\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C Telegram ID: ${label}`, title: copied === entry.fileId ? "\u0421\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E" : "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C ID", children: copied === entry.fileId ? /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(Copy, { className: "h-4 w-4" }) })
      ] }, `${entry.tokenId}:${entry.fileId}`);
    }) }),
    entries.length > 3 && /* @__PURE__ */ jsxs("button", { type: "button", "aria-expanded": expanded, className: "inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground", onClick: () => setExpanded(!expanded), children: [
      expanded ? /* @__PURE__ */ jsx(ChevronUp, { className: "h-4 w-4" }) : /* @__PURE__ */ jsx(ChevronDown, { className: "h-4 w-4" }),
      expanded ? "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0441\u043F\u0438\u0441\u043E\u043A" : `\u0415\u0449\u0451 ${entries.length - 3}`
    ] }),
    copied && /* @__PURE__ */ jsx("span", { role: "status", className: "sr-only", children: "Telegram ID \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D" }),
    error && /* @__PURE__ */ jsx("p", { role: "alert", className: "text-xs text-destructive", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C ID. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437." })
  ] });
}
export {
  FileCardIds
};
