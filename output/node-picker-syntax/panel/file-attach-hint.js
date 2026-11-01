import { jsx, jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Paperclip } from "lucide-react";
import { ATTACH_HINT_CLASS } from "./panel-styles";
import { getAttachHintKind, getAttachHintText } from "./file-attach-hint-text";
function FileAttachHint({
  mode,
  attachModeEnabled,
  hasTarget,
  nodeLabel,
  onChooseNode,
  children
}) {
  const kind = getAttachHintKind({ mode, attachModeEnabled, hasTarget });
  const text = getAttachHintText(kind, nodeLabel);
  if (mode === "page" && !attachModeEnabled) {
    return /* @__PURE__ */ jsxs("details", { className: "files-attach-help shrink-0 rounded-lg text-sm text-muted-foreground", "data-testid": "file-attach-hint", "data-kind": kind, children: [
      /* @__PURE__ */ jsx("summary", { className: "cursor-pointer rounded-lg px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary", children: "\u041A\u0430\u043A \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C \u0444\u0430\u0439\u043B \u043A \u0431\u043B\u043E\u043A\u0443" }),
      /* @__PURE__ */ jsx("p", { className: "px-3 pb-3 text-pretty text-sm", children: text })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: ATTACH_HINT_CLASS, "data-testid": "file-attach-hint", "data-kind": kind, children: [
    /* @__PURE__ */ jsx(Paperclip, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" }),
    /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-3", children: [
      /* @__PURE__ */ jsx("p", { children: text }),
      children,
      kind === "page-need-node" && onChooseNode && /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: onChooseNode, children: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0431\u043B\u043E\u043A \u043D\u0430 \u0445\u043E\u043B\u0441\u0442\u0435 \u2192" })
    ] })
  ] });
}
export {
  FileAttachHint
};
