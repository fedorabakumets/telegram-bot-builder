import { jsx, jsxs } from "react/jsx-runtime";
import { FileSize } from "./file-size";
import { Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/utils/utils";
import { MEDIA_TYPE_LABELS, formatDate, getPreviewUrl, shouldShowPreview } from "./files-table-utils";
import { getDownloadHref } from "./file-download";
import { MediaThumbnail } from "./media-thumbnail";
import { FileCardDetails } from "./file-card-details";
function FileCardPlaceholder({
  file,
  projectId,
  selected,
  selectedTokenId,
  onToggle,
  onCopy,
  onDelete,
  collaborators,
  allSheets,
  onGoToNode,
  onPreviewClick
}) {
  const previewUrl = getPreviewUrl(file, projectId);
  const downloadHref = getDownloadHref(file, projectId, selectedTokenId);
  const name = file.fileName ?? `\u0424\u0430\u0439\u043B ${file.id}`;
  return /* @__PURE__ */ jsxs("article", { className: cn("files-file-card rounded-xl border p-4 space-y-4", selected && "files-file-card-selected"), "aria-label": name, children: [
    /* @__PURE__ */ jsxs("div", { className: "files-card-heading flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(Checkbox, { checked: selected, onCheckedChange: onToggle, className: "mt-1 h-5 w-5 shrink-0", "aria-label": `\u0412\u044B\u0431\u0440\u0430\u0442\u044C ${name}` }),
      /* @__PURE__ */ jsx("button", { type: "button", onClick: onPreviewClick, disabled: !shouldShowPreview(file) || !previewUrl, "aria-label": `\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043F\u0440\u0435\u0432\u044C\u044E ${name}`, title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430 \u0432\u0435\u0441\u044C \u044D\u043A\u0440\u0430\u043D", className: "h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted flex items-center justify-center hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", children: /* @__PURE__ */ jsx(MediaThumbnail, { file, projectId }) }),
      /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold leading-5 [overflow-wrap:anywhere]", children: name }),
        /* @__PURE__ */ jsxs("p", { className: "flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsx("span", { children: MEDIA_TYPE_LABELS[file.mediaType ?? ""] ?? "\u0424\u0430\u0439\u043B" }),
          /* @__PURE__ */ jsx(FileSize, { file, projectId }),
          /* @__PURE__ */ jsx("span", { className: "text-xs self-center", children: formatDate(file.createdAt) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "files-card-actions flex flex-wrap items-center justify-between gap-2 border-t pt-3", children: /* @__PURE__ */ jsxs("div", { className: "files-card-buttons flex items-center gap-2", children: [
      downloadHref ? /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", asChild: true, children: /* @__PURE__ */ jsx("a", { href: downloadHref, download: name, "aria-label": `\u0421\u043A\u0430\u0447\u0430\u0442\u044C ${name}`, title: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0444\u0430\u0439\u043B", children: /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }) }) }) : /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", disabled: true, children: "\u0421\u043A\u0430\u0447\u0438\u0432\u0430\u043D\u0438\u0435 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E" }),
      onDelete && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 text-muted-foreground hover:text-destructive", onClick: () => onDelete(file.id), "aria-label": `\u0423\u0434\u0430\u043B\u0438\u0442\u044C ${name}`, title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0444\u0430\u0439\u043B", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
    ] }) }),
    /* @__PURE__ */ jsx(FileCardDetails, { file, projectId, selectedTokenId, collaborators, allSheets, onGoToNode, selected, onToggle, onCopy })
  ] });
}
export {
  FileCardPlaceholder
};
