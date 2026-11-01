import { jsx, jsxs } from "react/jsx-runtime";
import { VersionRow } from "./version-row";
function VersionList({ versions, totalVersions = versions.length, offset = 0, projectId, isLoading, restoringId, onRestore }) {
  if (isLoading) return /* @__PURE__ */ jsxs("div", { role: "status", className: "space-y-3", children: [
    /* @__PURE__ */ jsx("span", { className: "sr-only", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0438\u0441\u0442\u043E\u0440\u0438\u0438 \u0432\u0435\u0440\u0441\u0438\u0439\u2026" }),
    [0, 1, 2].map((index) => /* @__PURE__ */ jsxs("div", { className: "versions-surface space-y-3 rounded-xl border p-4", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsx("div", { className: "versions-inset h-4 w-32 rounded" }),
      /* @__PURE__ */ jsx("div", { className: "versions-inset h-3 w-48 max-w-full rounded" })
    ] }, index))
  ] });
  if (!versions.length) return /* @__PURE__ */ jsxs("div", { className: "versions-surface space-y-2 rounded-xl border border-dashed p-6", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-base font-semibold", children: "\u0417\u0434\u0435\u0441\u044C \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438" }),
    /* @__PURE__ */ jsx("p", { className: "text-pretty text-sm text-muted-foreground", children: "\u0421\u043D\u0438\u043C\u043A\u0438 \u0441\u043E\u0437\u0434\u0430\u044E\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430. \u0414\u043B\u044F \u0432\u0430\u0436\u043D\u043E\u0433\u043E \u044D\u0442\u0430\u043F\u0430 \u043C\u043E\u0436\u043D\u043E \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0447\u0435\u043A\u043F\u043E\u0438\u043D\u0442 \u0432\u044B\u0448\u0435." })
  ] });
  return /* @__PURE__ */ jsx("div", { role: "list", "aria-label": "\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438", className: "space-y-3", children: versions.map((version, index) => /* @__PURE__ */ jsx("div", { role: "listitem", children: /* @__PURE__ */ jsx(
    VersionRow,
    {
      version,
      projectId,
      versionNumber: totalVersions - offset - index,
      isLatest: offset + index === 0,
      isRestoring: restoringId === version.id,
      restoreDisabled: restoringId !== null,
      onRestore
    }
  ) }, version.id)) });
}
export {
  VersionList
};
