import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import "./file-node-picker.css";
import { NodePhotoGallery } from "./node-photo-gallery";
function FileNodePicker({ sheets, target, onSelect, projectId, tokenId }) {
  const id = useId();
  const [query, setQuery] = useState("");
  const [error, setError] = useState(false);
  const nodes = sheets.flatMap((sheet) => sheet.nodes.map((node) => ({
    id: node.id,
    sheet: sheet.name,
    label: String(node.data.messageText || node.data.label || node.id).replace(/<[^>]*>/g, "").slice(0, 80)
  })));
  const normalized = query.trim().toLowerCase();
  const filtered = nodes.filter((node) => `${node.id} ${node.label} ${node.sheet}`.toLowerCase().includes(normalized));
  const applyId = () => {
    const node = nodes.find((item) => item.id === query.trim());
    setError(!node);
    if (node) onSelect(node.id);
  };
  return /* @__PURE__ */ jsxs("div", { className: "file-node-picker space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: `${id}-search`, className: "block text-sm font-medium text-foreground", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 ID \u0431\u043B\u043E\u043A\u0430" }),
      /* @__PURE__ */ jsxs("div", { className: "file-node-picker-search flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            id: `${id}-search`,
            value: query,
            onChange: (event) => {
              setQuery(event.target.value);
              setError(false);
            },
            onKeyDown: (event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applyId();
              }
            },
            placeholder: "\u041D\u0430\u0439\u0442\u0438 \u0431\u043B\u043E\u043A \u0438\u043B\u0438 \u0432\u0441\u0442\u0430\u0432\u0438\u0442\u044C ID",
            className: `min-w-0 flex-1 ${error ? "border-destructive focus-visible:ring-destructive" : ""}`,
            "aria-invalid": error,
            "aria-describedby": error ? `${id}-error` : void 0
          }
        ),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: applyId, disabled: !query.trim(), children: "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u043F\u043E ID" })
      ] }),
      error && /* @__PURE__ */ jsx("p", { id: `${id}-error`, role: "alert", className: "text-sm text-destructive", children: "\u0411\u043B\u043E\u043A \u0441 \u0442\u0430\u043A\u0438\u043C ID \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0432 \u044D\u0442\u043E\u043C \u043F\u0440\u043E\u0435\u043A\u0442\u0435." })
    ] }),
    /* @__PURE__ */ jsxs(Select, { value: target?.nodeId ?? "", onValueChange: (nodeId) => {
      onSelect(nodeId);
      setError(false);
    }, children: [
      /* @__PURE__ */ jsx(SelectTrigger, { "aria-label": "\u0411\u043B\u043E\u043A \u0434\u043B\u044F \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u044F", className: "w-full min-w-0", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0431\u043B\u043E\u043A \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430" }) }),
      /* @__PURE__ */ jsxs(SelectContent, { className: "file-node-picker-menu", collisionPadding: 12, children: [
        filtered.map((node) => /* @__PURE__ */ jsx(SelectItem, { value: node.id, textValue: `${node.label} ${node.id}`, children: /* @__PURE__ */ jsxs("span", { className: "block min-w-0 space-y-1", children: [
          /* @__PURE__ */ jsx("span", { className: "block text-sm", children: node.label }),
          /* @__PURE__ */ jsxs("span", { className: "block text-xs text-muted-foreground", children: [
            node.sheet,
            " \xB7 ",
            node.id
          ] })
        ] }) }, node.id)),
        !filtered.length && /* @__PURE__ */ jsx("p", { className: "px-3 py-2 text-sm text-muted-foreground", children: "\u0411\u043B\u043E\u043A\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" })
      ] })
    ] }),
    target && /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-wrap items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("p", { className: "min-w-0 break-all text-xs text-muted-foreground", children: [
        "\u0412\u044B\u0431\u0440\u0430\u043D ID: ",
        target.nodeId
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => {
        onSelect(null);
        setQuery("");
        setError(false);
      }, children: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0431\u043B\u043E\u043A" })
    ] }),
    /* @__PURE__ */ jsx(NodePhotoGallery, { projectId, target, sheets, tokenId }, target?.nodeId ?? "none")
  ] });
}
export {
  FileNodePicker
};
