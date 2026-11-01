import { jsx, jsxs } from "react/jsx-runtime";
import { HardDrive, AlertTriangle, Infinity as InfinityIcon } from "lucide-react";
import { cn } from "@/utils/utils";
import { formatBytes } from "./format-bytes";
import {
  PANEL_DENSE_SECTION_CLASS,
  QUOTA_CAPTION_MUTED_CLASS,
  QUOTA_CAPTION_PRIMARY_CLASS,
  QUOTA_COMPACT_CARD_CLASS,
  QUOTA_EXCEEDED_ICON_CLASS,
  QUOTA_EXCEEDED_TEXT_CLASS,
  QUOTA_FILL_CLASS,
  QUOTA_FILL_TRANSITION_CLASS,
  QUOTA_TRACK_CLASS,
  QUOTA_UNLIMITED_BADGE_CLASS,
  QUOTA_UNLIMITED_BADGE_ICON_CLASS,
  resolveQuotaLevel
} from "./panel-styles";
function levelLabel(level, exceeded) {
  if (exceeded) return "\u041B\u0438\u043C\u0438\u0442 \u043F\u0440\u0435\u0432\u044B\u0448\u0435\u043D";
  if (level === "critical") return "\u041C\u0435\u0441\u0442\u0430 \u043F\u043E\u0447\u0442\u0438 \u043D\u0435 \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C";
  if (level === "warn") return "\u041C\u0435\u0441\u0442\u0430 \u043C\u0430\u043B\u043E";
  return "\u041C\u0435\u0441\u0442\u0430 \u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E";
}
function CompactQuotaBar({
  usedBytes,
  s3UsedBytes = 0,
  limitBytes,
  isLoading
}) {
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: QUOTA_COMPACT_CARD_CLASS, "data-testid": "storage-quota-bar", "data-state": "loading", children: /* @__PURE__ */ jsx("div", { className: cn(QUOTA_TRACK_CLASS, "h-1.5 animate-pulse") }) });
  }
  if (limitBytes === null) {
    return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2 py-1 text-sm text-muted-foreground", "data-testid": "storage-quota-bar", "data-state": "unlimited", title: `\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E: ${formatBytes(usedBytes)} \xB7 S3: ${formatBytes(s3UsedBytes)}`, children: [
      /* @__PURE__ */ jsx(HardDrive, { className: "h-4 w-4 shrink-0", "aria-hidden": true }),
      /* @__PURE__ */ jsxs("span", { children: [
        "\u0417\u0430\u043D\u044F\u0442\u043E ",
        formatBytes(usedBytes + s3UsedBytes)
      ] }),
      /* @__PURE__ */ jsx("span", { "aria-hidden": true, children: "\xB7" }),
      /* @__PURE__ */ jsx("span", { children: "\u0411\u0435\u0437 \u043B\u0438\u043C\u0438\u0442\u0430" })
    ] });
  }
  const exceeded = usedBytes > limitBytes;
  const percent = limitBytes > 0 ? usedBytes / limitBytes * 100 : 0;
  const level = resolveQuotaLevel(percent);
  const fillWidth = Math.min(100, Math.max(0, percent));
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: QUOTA_COMPACT_CARD_CLASS,
      "data-testid": "storage-quota-bar",
      "data-state": exceeded ? "exceeded" : level,
      children: [
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "\u0412\u0441\u0435\u0433\u043E ",
          formatBytes(usedBytes + s3UsedBytes),
          " \xB7 S3: ",
          formatBytes(s3UsedBytes)
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-1.5", children: [
            exceeded ? /* @__PURE__ */ jsx(AlertTriangle, { className: QUOTA_EXCEEDED_ICON_CLASS, "aria-hidden": true }) : /* @__PURE__ */ jsx(HardDrive, { className: "h-3.5 w-3.5 shrink-0", "aria-hidden": true }),
            /* @__PURE__ */ jsxs("span", { className: QUOTA_CAPTION_PRIMARY_CLASS, children: [
              Math.round(percent),
              "%"
            ] }),
            /* @__PURE__ */ jsx("span", { className: cn("truncate hidden sm:inline"), children: levelLabel(level, exceeded) })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-border/60 hidden sm:inline", children: "\xB7" }),
          /* @__PURE__ */ jsxs("span", { className: cn(QUOTA_CAPTION_MUTED_CLASS, "shrink-0 tabular-nums"), children: [
            "\u041B\u043E\u043A\u0430\u043B\u044C\u043D\u043E: ",
            formatBytes(usedBytes),
            " / ",
            formatBytes(limitBytes)
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn("h-1", QUOTA_TRACK_CLASS), children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(QUOTA_FILL_TRANSITION_CLASS, QUOTA_FILL_CLASS[level]),
            style: { width: `${fillWidth}%` },
            "data-testid": "storage-quota-fill"
          }
        ) })
      ]
    }
  );
}
function StorageQuotaBar(props) {
  const { usedBytes, limitBytes, isLoading, compact } = props;
  if (compact) {
    return /* @__PURE__ */ jsx(CompactQuotaBar, { ...props });
  }
  if (isLoading) {
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: PANEL_DENSE_SECTION_CLASS,
        "data-testid": "storage-quota-bar",
        "data-state": "loading",
        children: /* @__PURE__ */ jsx("div", { className: cn(QUOTA_TRACK_CLASS, "animate-pulse") })
      }
    );
  }
  if (limitBytes === null) {
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn("flex items-center gap-2 text-xs", PANEL_DENSE_SECTION_CLASS),
        "data-testid": "storage-quota-bar",
        "data-state": "unlimited",
        children: [
          /* @__PURE__ */ jsxs("span", { className: QUOTA_UNLIMITED_BADGE_CLASS, children: [
            /* @__PURE__ */ jsx(InfinityIcon, { className: QUOTA_UNLIMITED_BADGE_ICON_CLASS, "aria-hidden": true }),
            "\u0411\u0435\u0437\u043B\u0438\u043C\u0438\u0442\u043D\u043E"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: QUOTA_CAPTION_MUTED_CLASS, children: [
            "\u0437\u0430\u043D\u044F\u0442\u043E ",
            formatBytes(usedBytes)
          ] })
        ]
      }
    );
  }
  const exceeded = usedBytes > limitBytes;
  const percent = limitBytes > 0 ? usedBytes / limitBytes * 100 : 0;
  const level = resolveQuotaLevel(percent);
  const fillWidth = Math.min(100, Math.max(0, percent));
  const percentLabel = `${Math.round(percent)}%`;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: PANEL_DENSE_SECTION_CLASS,
      "data-testid": "storage-quota-bar",
      "data-state": exceeded ? "exceeded" : level,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
          exceeded ? /* @__PURE__ */ jsx(AlertTriangle, { className: QUOTA_EXCEEDED_ICON_CLASS, "aria-hidden": true }) : /* @__PURE__ */ jsx(HardDrive, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground", "aria-hidden": true }),
          /* @__PURE__ */ jsx("span", { className: QUOTA_CAPTION_PRIMARY_CLASS, children: percentLabel }),
          /* @__PURE__ */ jsxs("span", { className: QUOTA_CAPTION_MUTED_CLASS, children: [
            "\u2014 ",
            levelLabel(level, exceeded),
            " \u2014"
          ] }),
          /* @__PURE__ */ jsxs("span", { className: QUOTA_CAPTION_MUTED_CLASS, children: [
            formatBytes(usedBytes),
            " / ",
            formatBytes(limitBytes)
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn("mt-1.5", QUOTA_TRACK_CLASS), children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(QUOTA_FILL_TRANSITION_CLASS, QUOTA_FILL_CLASS[level]),
            style: { width: `${fillWidth}%` },
            "data-testid": "storage-quota-fill"
          }
        ) }),
        exceeded && /* @__PURE__ */ jsx("p", { className: QUOTA_EXCEEDED_TEXT_CLASS, "data-testid": "storage-quota-warning", children: "\u0425\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 \u043F\u0435\u0440\u0435\u043F\u043E\u043B\u043D\u0435\u043D\u043E. \u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0439, \u043D\u043E \u043E\u0441\u0432\u043E\u0431\u043E\u0434\u0438\u0442\u0435 \u043C\u0435\u0441\u0442\u043E." })
      ]
    }
  );
}
export {
  StorageQuotaBar
};
