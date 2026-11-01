import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useRef, useState } from "react";
import { GitCommit } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkspaceActionButton as Button } from "@/components/ui/workspace-action-button";
import { useToast } from "@/hooks/use-toast";
import { useCreateProjectCommit } from "@/hooks/use-project-versions";
function CommitForm({ projectId, compact }) {
  const { toast } = useToast();
  const id = useId();
  const inputRef = useRef(null);
  const [message, setMessage] = useState("");
  const [fieldError, setFieldError] = useState(false);
  const [requestError, setRequestError] = useState(false);
  const commitMutation = useCreateProjectCommit(projectId);
  const handleSubmit = (event) => {
    event.preventDefault();
    if (commitMutation.isPending) return;
    const text = message.trim();
    if (!text) {
      setFieldError(true);
      inputRef.current?.focus();
      return;
    }
    setRequestError(false);
    commitMutation.mutate({ message: text }, {
      /** Очищает форму после успешного сохранения. */
      onSuccess: () => {
        setMessage("");
        toast({ title: "\u0427\u0435\u043A\u043F\u043E\u0438\u043D\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D", description: text });
      },
      /** Сохраняет название и показывает возможность повторной попытки. */
      onError: () => setRequestError(true)
    });
  };
  return /* @__PURE__ */ jsxs(
    "form",
    {
      noValidate: true,
      onSubmit: handleSubmit,
      "aria-busy": commitMutation.isPending,
      className: compact ? "space-y-2 px-3 py-2" : "versions-surface versions-checkpoint space-y-3 rounded-xl border p-4",
      children: [
        /* @__PURE__ */ jsxs("div", { className: compact ? "flex items-start gap-2" : "checkpoint-fields flex items-end gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1 space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: compact ? "sr-only" : "flex flex-wrap items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsx(Label, { htmlFor: `${id}-name`, className: `text-sm ${fieldError ? "text-destructive" : ""}`, children: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0447\u0435\u043A\u043F\u043E\u0438\u043D\u0442\u0430" }),
              /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: "\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E" })
            ] }),
            /* @__PURE__ */ jsx(
              Input,
              {
                ref: inputRef,
                id: `${id}-name`,
                value: message,
                required: true,
                disabled: commitMutation.isPending,
                onChange: (event) => {
                  setMessage(event.target.value);
                  if (event.target.value.trim()) setFieldError(false);
                },
                placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D \u0432\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 Telegram",
                "aria-invalid": fieldError,
                "aria-describedby": fieldError ? `${id}-error` : void 0,
                className: `checkpoint-input text-sm ${compact ? "h-8" : "h-10 rounded-lg"}`
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Button,
            {
              type: "submit",
              size: compact ? "icon" : "default",
              disabled: commitMutation.isPending || !!compact && !message.trim(),
              className: `versions-action shrink-0 px-3 font-semibold ${compact ? "h-8 w-8" : ""}`,
              "aria-label": "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0447\u0435\u043A\u043F\u043E\u0438\u043D\u0442",
              title: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0447\u0435\u043A\u043F\u043E\u0438\u043D\u0442",
              children: [
                /* @__PURE__ */ jsx(GitCommit, { className: "h-4 w-4", "aria-hidden": "true" }),
                !compact && (commitMutation.isPending ? "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u2026" : "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C")
              ]
            }
          )
        ] }),
        !compact && !fieldError && /* @__PURE__ */ jsx("p", { className: "text-pretty text-xs text-muted-foreground", children: "\u0418\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0441\u043D\u0438\u043C\u043E\u043A \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430." }),
        fieldError && /* @__PURE__ */ jsx("p", { id: `${id}-error`, role: "alert", className: "text-pretty text-xs text-destructive", children: "\u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u0447\u0442\u043E\u0431\u044B \u043D\u0430\u0439\u0442\u0438 \u044D\u0442\u043E\u0442 \u0447\u0435\u043A\u043F\u043E\u0438\u043D\u0442 \u0432 \u0438\u0441\u0442\u043E\u0440\u0438\u0438." }),
        requestError && /* @__PURE__ */ jsx("p", { role: "alert", className: "text-pretty text-sm text-destructive", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u0447\u0435\u043A\u043F\u043E\u0438\u043D\u0442. \u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u0432 \u043F\u043E\u043B\u0435, \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437." })
      ]
    }
  );
}
export {
  CommitForm
};
