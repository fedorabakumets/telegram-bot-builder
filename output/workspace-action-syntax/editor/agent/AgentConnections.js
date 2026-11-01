import { jsx, jsxs } from "react/jsx-runtime";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { WorkspaceActionButton } from "@/components/ui/workspace-action-button";
import { apiRequest } from "@/queryClient";
const TELEGRAM_AGENT_URL = "https://t.me/botcraftstudiobot";
const CONNECTION_STEPS = [
  { title: "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0430\u0433\u0435\u043D\u0442\u0430", text: "\u041F\u0435\u0440\u0435\u0439\u0434\u0438\u0442\u0435 \u0432 \u043B\u0438\u0447\u043D\u044B\u0439 \u0447\u0430\u0442 \u0432 Telegram." },
  { title: "\u041D\u0430\u043F\u0438\u0448\u0438\u0442\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435", text: "\u0412\u0430\u0448 \u043F\u0440\u043E\u0444\u0438\u043B\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438." },
  { title: "\u0420\u0430\u0431\u043E\u0442\u0430\u0439\u0442\u0435 \u0441 \u0431\u043E\u0442\u0430\u043C\u0438", text: "\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0430\u0433\u0435\u043D\u0442\u0443, \u0447\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0441\u0434\u0435\u043B\u0430\u0442\u044C." }
];
function AgentConnections() {
  const queryClient = useQueryClient();
  const key = "/api/agent-connections";
  const query = useQuery({ queryKey: [key] });
  const mutation = useMutation({
    /**
     * Переключает доступ выбранного подключения.
     * @param item - Подключение агента.
     */
    mutationFn: async (item) => {
      await apiRequest("PATCH", `${key}/${item.id}`, { enabled: !item.enabled });
    },
    /** Обновляет сведения о подключениях и связанных токенах. */
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [key] });
      void queryClient.invalidateQueries({ queryKey: ["/api/agent-tokens"] });
    }
  });
  return /* @__PURE__ */ jsxs("section", { "aria-labelledby": "telegram-agent-heading", className: "agent-surface space-y-6 rounded-2xl border p-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold uppercase tracking-widest text-muted-foreground", children: "\u0411\u044B\u0441\u0442\u0440\u044B\u0439 \u0441\u0442\u0430\u0440\u0442" }),
        /* @__PURE__ */ jsx("h3", { id: "telegram-agent-heading", className: "text-xl font-semibold", children: "Telegram Agent" }),
        /* @__PURE__ */ jsx("p", { className: "text-pretty text-sm text-muted-foreground", children: "\u0411\u0435\u0437 \u0440\u0443\u0447\u043D\u043E\u0439 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u0442\u043E\u043A\u0435\u043D\u0430." })
      ] }),
      /* @__PURE__ */ jsx(WorkspaceActionButton, { asChild: true, className: "agent-action h-auto px-3 py-2 text-base font-semibold", children: /* @__PURE__ */ jsxs("a", { href: TELEGRAM_AGENT_URL, target: "_blank", rel: "noopener noreferrer", children: [
        "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 Telegram ",
        /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2197" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("ol", { className: "agent-steps grid gap-6", children: CONNECTION_STEPS.map((step, index) => /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-3", children: [
      /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: "agent-step flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold", children: index + 1 }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: step.title }),
        /* @__PURE__ */ jsx("p", { className: "text-pretty text-sm text-muted-foreground", children: step.text })
      ] })
    ] }, step.title)) }),
    /* @__PURE__ */ jsxs("div", { className: "agent-inset space-y-3 rounded-xl p-4", children: [
      query.isLoading && /* @__PURE__ */ jsx("div", { role: "status", className: "agent-skeleton h-12 rounded-lg bg-muted", children: /* @__PURE__ */ jsx("span", { className: "sr-only", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0439\u2026" }) }),
      query.isError && /* @__PURE__ */ jsxs("p", { role: "alert", className: "text-sm text-destructive", children: [
        "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F. ",
        /* @__PURE__ */ jsx("button", { className: "underline underline-offset-4 focus-visible:outline focus-visible:outline-2", onClick: () => void query.refetch(), children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C" })
      ] }),
      query.data?.length === 0 && /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
        /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm font-medium", children: [
          /* @__PURE__ */ jsx("span", { className: "h-2 w-2 rounded-full bg-muted-foreground", "aria-hidden": "true" }),
          "\u041E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-pretty text-sm text-muted-foreground", children: "\u041F\u043E\u0441\u043B\u0435 \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F \u0430\u0433\u0435\u043D\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C." })
      ] }),
      query.data?.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "min-w-0 space-y-1", children: [
          /* @__PURE__ */ jsx("p", { className: "break-all text-sm font-semibold", children: item.agentId }),
          /* @__PURE__ */ jsxs("p", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsx("span", { "aria-hidden": "true", className: `h-2 w-2 rounded-full ${item.enabled ? "bg-emerald-500" : "bg-muted-foreground"}` }),
            item.enabled ? "\u0414\u043E\u0441\u0442\u0443\u043F \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D" : "\u0414\u043E\u0441\u0442\u0443\u043F \u043E\u0442\u043A\u043B\u044E\u0447\u0451\u043D"
          ] })
        ] }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", className: "agent-action px-3", disabled: mutation.isPending, onClick: () => mutation.mutate(item), children: mutation.isPending && mutation.variables?.id === item.id ? "\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435\u2026" : item.enabled ? "\u041E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C" : "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0441\u043D\u043E\u0432\u0430" })
      ] }, item.id)),
      mutation.isError && /* @__PURE__ */ jsx("p", { role: "alert", className: "text-sm text-destructive", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F. \u041F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437." })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-pretty text-xs text-muted-foreground", children: "\u0412\u044B \u0443\u043F\u0440\u0430\u0432\u043B\u044F\u0435\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043E\u043C. \u041F\u043E\u0441\u043B\u0435 \u043E\u0442\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0435\u0433\u043E \u043C\u043E\u0436\u043D\u043E \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u0430 \u044D\u0442\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435." })
  ] });
}
export {
  AgentConnections
};
