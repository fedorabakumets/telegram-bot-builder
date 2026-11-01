import { jsx, jsxs } from "react/jsx-runtime";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FilePageSize } from "../files/panel/file-page-size";
import "./versions-pagination.css";
function VersionsPagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return /* @__PURE__ */ jsxs("nav", { "aria-label": "\u041D\u0430\u0432\u0438\u0433\u0430\u0446\u0438\u044F \u043F\u043E \u0432\u0435\u0440\u0441\u0438\u044F\u043C", className: "versions-pagination", children: [
    /* @__PURE__ */ jsx(FilePageSize, { ariaLabel: "\u0412\u0435\u0440\u0441\u0438\u0439 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435", value: pageSize, onChange: onPageSizeChange }),
    /* @__PURE__ */ jsxs("div", { className: "versions-pagination-controls flex items-center gap-1", children: [
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outline",
          size: "icon",
          className: "h-10 w-10 rounded-lg",
          disabled: page <= 1,
          onClick: () => onPageChange(page - 1),
          "aria-label": "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0432\u0435\u0440\u0441\u0438\u0439",
          children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
        }
      ),
      /* @__PURE__ */ jsxs("span", { className: "whitespace-nowrap text-sm tabular-nums", children: [
        page,
        " / ",
        totalPages
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          variant: "outline",
          size: "icon",
          className: "h-10 w-10 rounded-lg",
          disabled: page >= totalPages,
          onClick: () => onPageChange(page + 1),
          "aria-label": "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0432\u0435\u0440\u0441\u0438\u0439",
          children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
        }
      )
    ] }),
    /* @__PURE__ */ jsx("span", { className: "versions-pagination-range text-xs text-muted-foreground", children: total ? `${(page - 1) * pageSize + 1}\u2013${Math.min(page * pageSize, total)} \u0438\u0437 ${total.toLocaleString("ru-RU")}` : "0 \u0432\u0435\u0440\u0441\u0438\u0439" })
  ] });
}
export {
  VersionsPagination
};
