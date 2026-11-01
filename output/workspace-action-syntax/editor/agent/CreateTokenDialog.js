import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { WorkspaceActionButton } from "@/components/ui/workspace-action-button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAgentToken } from "./use-agent-tokens";
import "./agent-page.css";
function CreateTokenDialog({ open, onOpenChange, onCreated }) {
  const createToken = useCreateAgentToken();
  const id = useId();
  const labelRef = useRef(null);
  const [label, setLabel] = useState("");
  const [expiry, setExpiry] = useState("0");
  const [error, setError] = useState("");
  const [labelError, setLabelError] = useState(false);
  const handleOpenChange = (nextOpen) => {
    if (createToken.isPending) return;
    if (!nextOpen) {
      setLabel("");
      setExpiry("0");
      setError("");
      setLabelError(false);
    }
    onOpenChange(nextOpen);
  };
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (createToken.isPending) return;
    if (!label.trim()) {
      setLabelError(true);
      setError("\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u043B\u0438\u0447\u0430\u0442\u044C \u044D\u0442\u043E\u0442 \u0442\u043E\u043A\u0435\u043D \u043E\u0442 \u0434\u0440\u0443\u0433\u0438\u0445.");
      labelRef.current?.focus();
      return;
    }
    setError("");
    setLabelError(false);
    const expiresInDays = Number.parseInt(expiry, 10);
    try {
      const result = await createToken.mutateAsync({
        label: label.trim(),
        scopes: "read,write",
        ...expiresInDays > 0 ? { expiresInDays } : {}
      });
      setLabel("");
      setExpiry("0");
      onOpenChange(false);
      onCreated(result.token);
    } catch {
      setError("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0441\u043E\u0435\u0434\u0438\u043D\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437.");
    }
  };
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: handleOpenChange, children: /* @__PURE__ */ jsxs(DialogContent, { className: "agent-dialog agent-surface gap-6 rounded-2xl p-6 sm:p-6", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { className: "space-y-2 pr-6 text-left", children: [
      /* @__PURE__ */ jsx(DialogTitle, { className: "text-2xl font-semibold tracking-normal", children: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D" }),
      /* @__PURE__ */ jsx(DialogDescription, { className: "text-pretty text-sm", children: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0441\u0432\u043E\u0439 \u0418\u0418 \u043A\u043B\u0438\u0435\u043D\u0442 \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0430\u043C \u0447\u0435\u0440\u0435\u0437 MCP." })
    ] }),
    /* @__PURE__ */ jsxs("form", { noValidate: true, onSubmit: handleSubmit, className: "space-y-4", "aria-busy": createToken.isPending, children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsx(Label, { htmlFor: `${id}-label`, className: `text-sm font-medium ${labelError ? "text-destructive" : ""}`, children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0430" }),
          /* @__PURE__ */ jsx("span", { className: `text-xs ${labelError ? "text-destructive" : "text-muted-foreground"}`, children: "\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E" })
        ] }),
        /* @__PURE__ */ jsx(
          Input,
          {
            ref: labelRef,
            id: `${id}-label`,
            placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, Cursor \u043D\u0430 \u043D\u043E\u0443\u0442\u0431\u0443\u043A\u0435",
            value: label,
            onChange: (event) => {
              setLabel(event.target.value);
              if (labelError && event.target.value.trim()) {
                setLabelError(false);
                setError("");
              }
            },
            required: true,
            disabled: createToken.isPending,
            "aria-invalid": labelError,
            "aria-describedby": labelError ? `${id}-error` : `${id}-hint`,
            className: "agent-field h-12 rounded-lg px-3 text-base"
          }
        ),
        labelError ? /* @__PURE__ */ jsx("p", { id: `${id}-error`, role: "alert", className: "text-pretty text-xs text-destructive", children: error }) : /* @__PURE__ */ jsx("p", { id: `${id}-hint`, className: "text-pretty text-xs text-muted-foreground", children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0432\u0438\u0434\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u0430\u043C. \u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0430 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u0442\u043E\u043A\u0435\u043D." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx(Label, { htmlFor: `${id}-expiry`, className: "text-sm font-medium", children: "\u0421\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F" }),
        /* @__PURE__ */ jsxs(Select, { value: expiry, onValueChange: setExpiry, disabled: createToken.isPending, children: [
          /* @__PURE__ */ jsx(SelectTrigger, { id: `${id}-expiry`, "aria-describedby": `${id}-expiry-hint`, className: "agent-field h-12 rounded-lg px-3 text-sm", children: /* @__PURE__ */ jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxs(SelectContent, { className: "agent-dialog agent-surface rounded-lg", children: [
            /* @__PURE__ */ jsx(SelectItem, { value: "0", children: "\u0411\u0435\u0437 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "30", children: "30 \u0434\u043D\u0435\u0439" }),
            /* @__PURE__ */ jsx(SelectItem, { value: "90", children: "90 \u0434\u043D\u0435\u0439" })
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { id: `${id}-expiry-hint`, className: "text-pretty text-xs text-muted-foreground", children: expiry === "0" ? "\u0422\u043E\u043A\u0435\u043D \u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442, \u043F\u043E\u043A\u0430 \u0432\u044B \u043D\u0435 \u043E\u0442\u0437\u043E\u0432\u0451\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F." : "\u041F\u043E \u043E\u043A\u043E\u043D\u0447\u0430\u043D\u0438\u0438 \u0441\u0440\u043E\u043A\u0430 \u043A\u043B\u0438\u0435\u043D\u0442\u0443 \u043F\u043E\u043D\u0430\u0434\u043E\u0431\u0438\u0442\u0441\u044F \u043D\u043E\u0432\u044B\u0439 \u0442\u043E\u043A\u0435\u043D." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "agent-inset space-y-1 rounded-xl p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "\u0414\u043E\u0441\u0442\u0443\u043F \u043A \u043F\u0440\u043E\u0435\u043A\u0442\u0430\u043C: \u0447\u0442\u0435\u043D\u0438\u0435 \u0438 \u0437\u0430\u043F\u0438\u0441\u044C" }),
        /* @__PURE__ */ jsx("p", { className: "text-pretty text-xs text-muted-foreground", children: "\u041A\u043B\u0438\u0435\u043D\u0442 \u0441\u043C\u043E\u0436\u0435\u0442 \u043F\u0440\u043E\u0441\u043C\u0430\u0442\u0440\u0438\u0432\u0430\u0442\u044C \u0438 \u0438\u0437\u043C\u0435\u043D\u044F\u0442\u044C \u0432\u0430\u0448\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u044B. \u0414\u043E\u0441\u0442\u0443\u043F \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u043D\u0430 \u0432\u043A\u043B\u0430\u0434\u043A\u0435 \xAB\u0410\u0433\u0435\u043D\u0442\xBB." })
      ] }),
      error && !labelError && /* @__PURE__ */ jsx("p", { role: "alert", className: "text-pretty text-sm text-destructive", children: error }),
      /* @__PURE__ */ jsx("p", { className: "text-pretty text-xs text-muted-foreground", children: "\u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0442\u043E\u043A\u0435\u043D \u043F\u043E\u0441\u043B\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F. \u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u043E\u043D \u0431\u0443\u0434\u0435\u0442 \u043F\u043E\u043A\u0430\u0437\u0430\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0434\u0438\u043D \u0440\u0430\u0437." }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col-reverse gap-3 sm:flex-row sm:justify-end", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", disabled: createToken.isPending, onClick: () => handleOpenChange(false), className: "agent-action px-3 font-semibold", children: "\u041E\u0442\u043C\u0435\u043D\u0430" }),
        /* @__PURE__ */ jsx(WorkspaceActionButton, { type: "submit", disabled: createToken.isPending, className: "agent-action px-3 text-base font-semibold", children: createToken.isPending ? "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0442\u043E\u043A\u0435\u043D\u0430\u2026" : "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D" })
      ] })
    ] })
  ] }) });
}
export {
  CreateTokenDialog
};
