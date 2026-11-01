import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { History, GitCommit, RotateCcw, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VersionDiffSummary } from "./version-diff-summary";
function formatRelative(value) {
  if (!value) return "\u0414\u0430\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "\u0414\u0430\u0442\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430";
  const now = /* @__PURE__ */ new Date();
  const days = Math.round((new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 864e5);
  const time = date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (days === 0) return `\u0421\u0435\u0433\u043E\u0434\u043D\u044F, ${time}`;
  if (days === 1) return `\u0412\u0447\u0435\u0440\u0430, ${time}`;
  return date.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function VersionRow({ version, projectId, versionNumber, isLatest, isRestoring, restoreDisabled, compact, onRestore }) {
  const [showDiff, setShowDiff] = useState(false);
  const manual = version.kind === "manual";
  const createdAt = version.createdAt ? new Date(version.createdAt) : null;
  const title = manual ? version.label || "\u0427\u0435\u043A\u043F\u043E\u0438\u043D\u0442" : versionNumber != null ? `\u0412\u0435\u0440\u0441\u0438\u044F ${versionNumber}` : version.label || "\u0412\u0435\u0440\u0441\u0438\u044F";
  return /* @__PURE__ */ jsxs("article", { className: compact ? "border-b border-border" : "versions-surface version-entry rounded-xl border p-4", children: [
    /* @__PURE__ */ jsxs("div", { className: compact ? "flex items-center justify-between gap-3 px-4 py-3" : "version-row grid items-start gap-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-start gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "versions-inset flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground", children: manual ? /* @__PURE__ */ jsx(GitCommit, { className: "h-4 w-4", "aria-hidden": "true" }) : /* @__PURE__ */ jsx(History, { className: "h-4 w-4", "aria-hidden": "true" }) }),
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
            /* @__PURE__ */ jsx("h4", { className: "min-w-0 break-words text-sm font-semibold", title, children: title }),
            isLatest && /* @__PURE__ */ jsx("span", { className: "versions-inset shrink-0 rounded-md px-2 py-1 text-xs text-muted-foreground", children: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { children: manual ? "\u0427\u0435\u043A\u043F\u043E\u0438\u043D\u0442" : "\u0410\u0432\u0442\u043E\u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435" }),
            /* @__PURE__ */ jsx("time", { dateTime: createdAt && !Number.isNaN(createdAt.getTime()) ? createdAt.toISOString() : void 0, children: formatRelative(version.createdAt) })
          ] }),
          version.authorName && /* @__PURE__ */ jsx("p", { className: "break-words text-xs text-muted-foreground", title: version.authorName, children: version.authorName })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: `flex flex-wrap items-center gap-2 ${compact ? "shrink-0" : "version-actions"}`, children: [
        projectId != null && /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: compact ? "icon" : "sm",
            className: "versions-action h-8 px-3 text-xs",
            onClick: () => setShowDiff((value) => !value),
            "aria-expanded": showDiff,
            "aria-label": `\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C: ${title}`,
            title: "\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C \u0441 \u0442\u0435\u043A\u0443\u0449\u0438\u043C \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u0435\u043C",
            children: [
              /* @__PURE__ */ jsx(GitCompare, { className: "h-4 w-4", "aria-hidden": "true" }),
              !compact && "\u0421\u0440\u0430\u0432\u043D\u0438\u0442\u044C"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: compact ? "icon" : "sm",
            className: "versions-action h-8 px-3 text-xs text-muted-foreground hover:text-foreground",
            disabled: isRestoring || restoreDisabled,
            onClick: () => onRestore(version.id),
            "aria-label": `\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C: ${title}`,
            title: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u0435\u0440\u0441\u0438\u044E",
            children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "h-4 w-4", "aria-hidden": "true" }),
              !compact && (isRestoring ? "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435\u2026" : "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C")
            ]
          }
        )
      ] })
    ] }),
    showDiff && projectId != null && /* @__PURE__ */ jsx("div", { className: "versions-inset version-diff mt-3 rounded-lg p-1", role: "region", "aria-label": `\u0421\u0440\u0430\u0432\u043D\u0435\u043D\u0438\u0435: ${title}`, children: /* @__PURE__ */ jsx(VersionDiffSummary, { projectId, versionId: version.id }) })
  ] });
}
export {
  VersionRow
};
