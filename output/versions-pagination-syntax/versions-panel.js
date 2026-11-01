import { jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useState, useRef, useEffect } from "react";
import { History, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkspaceTabHeading } from "@/components/ui/workspace-tab-heading";
import { useToast } from "@/hooks/use-toast";
import { useProjectVersions, useRestoreProjectVersion } from "@/hooks/use-project-versions";
import { VersionList } from "./version-list";
import { CommitForm } from "./commit-form";
import { VersionsPagination } from "./versions-pagination";
import "./versions-page.css";
function VersionsPanel({ projectId, onRestored }) {
  const { toast } = useToast();
  const { data: versions = [], isLoading, isError, isFetching, refetch } = useProjectVersions(projectId);
  const restoreMutation = useRestoreProjectVersion(projectId);
  const [restoringId, setRestoringId] = useState(null);
  const panel = useRef(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(versions.length / pageSize)));
  const offset = (currentPage - 1) * pageSize;
  useEffect(() => {
    setPage(1);
  }, [projectId]);
  const scrollToVersions = () => requestAnimationFrame(() => {
    const root = panel.current;
    const list = root?.querySelector('[aria-labelledby="saved-versions-heading"]');
    if (root && list) root.scrollTo({ top: root.scrollTop + list.getBoundingClientRect().top - root.getBoundingClientRect().top - 16, behavior: "instant" });
  });
  const handleRestore = useCallback((versionId) => {
    setRestoringId(versionId);
    restoreMutation.mutate(versionId, {
      onSuccess: () => {
        toast({
          title: "\u0412\u0435\u0440\u0441\u0438\u044F \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430",
          description: "\u041F\u0440\u043E\u0435\u043A\u0442 \u043E\u0442\u043A\u0430\u0442\u0430\u043D \u043A \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0438. \u0418\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0432\u0438\u0434\u043D\u044B \u043D\u0430 \u0445\u043E\u043B\u0441\u0442\u0435."
        });
        try {
          onRestored?.();
        } catch (err) {
          console.error("[VersionsPanel] \u041E\u0448\u0438\u0431\u043A\u0430 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0445\u043E\u043B\u0441\u0442\u0430 \u043F\u043E\u0441\u043B\u0435 \u043E\u0442\u043A\u0430\u0442\u0430:", err);
        }
      },
      onError: () => {
        toast({
          title: "\u041E\u0448\u0438\u0431\u043A\u0430 \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F",
          description: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u0435\u0440\u0441\u0438\u044E \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
          variant: "destructive"
        });
      },
      onSettled: () => {
        setRestoringId(null);
      }
    });
  }, [restoreMutation, onRestored, toast]);
  return /* @__PURE__ */ jsx("div", { ref: panel, className: "versions-page h-full overflow-auto bg-background p-4 sm:p-6", children: /* @__PURE__ */ jsxs("div", { className: "versions-content mx-auto max-w-5xl space-y-6 pb-4", children: [
    /* @__PURE__ */ jsx(
      WorkspaceTabHeading,
      {
        title: "\u0418\u0441\u0442\u043E\u0440\u0438\u044F \u0432\u0435\u0440\u0441\u0438\u0439",
        icon: /* @__PURE__ */ jsx(History, {}),
        description: "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0439\u0442\u0435 \u0432\u0430\u0436\u043D\u044B\u0435 \u044D\u0442\u0430\u043F\u044B \u0438 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0439\u0442\u0435\u0441\u044C \u043A \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0438\u043C \u0432\u0435\u0440\u0441\u0438\u044F\u043C \u043F\u0440\u043E\u0435\u043A\u0442\u0430.",
        actions: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "icon",
            disabled: isFetching,
            onClick: () => void refetch(),
            className: "versions-action h-8 w-8",
            "aria-label": isFetching ? "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u0438\u0441\u0442\u043E\u0440\u0438\u0438\u2026" : "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0432\u0435\u0440\u0441\u0438\u0439",
            title: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0432\u0435\u0440\u0441\u0438\u0439",
            children: /* @__PURE__ */ jsx(RefreshCw, { className: "h-4 w-4", "aria-hidden": "true" })
          }
        )
      }
    ),
    /* @__PURE__ */ jsx(CommitForm, { projectId }),
    /* @__PURE__ */ jsxs("section", { className: "space-y-3", "aria-labelledby": "saved-versions-heading", "aria-busy": isFetching, children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsx("h3", { id: "saved-versions-heading", className: "text-lg font-semibold", children: "\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u044B\u0435 \u0432\u0435\u0440\u0441\u0438\u0438" }),
        !isLoading && !isError && /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
          "\u0412\u0441\u0435\u0433\u043E: ",
          versions.length
        ] })
      ] }),
      isError ? /* @__PURE__ */ jsxs("div", { role: "alert", className: "versions-surface space-y-3 rounded-xl border p-4", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-destructive", children: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E \u0432\u0435\u0440\u0441\u0438\u0439." }),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: () => void refetch(), disabled: isFetching, children: "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0443" })
      ] }) : /* @__PURE__ */ jsx(VersionList, { versions: versions.slice(offset, offset + pageSize), totalVersions: versions.length, offset, projectId, isLoading, restoringId, onRestore: handleRestore })
    ] }),
    !isLoading && !isError && versions.length > 0 && /* @__PURE__ */ jsx(
      VersionsPagination,
      {
        page: currentPage,
        pageSize,
        total: versions.length,
        onPageChange: (next) => {
          setPage(next);
          scrollToVersions();
        },
        onPageSizeChange: (size) => {
          setPageSize(size);
          setPage(1);
          scrollToVersions();
        }
      }
    )
  ] }) });
}
export {
  VersionsPanel
};
