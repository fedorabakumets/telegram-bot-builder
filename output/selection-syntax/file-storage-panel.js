import { jsx, jsxs } from "react/jsx-runtime";
import { FilePageSize } from "./file-page-size";
import { Switch } from "@/components/ui/switch";
import { useFileStoragePanelState } from "./use-file-storage-panel-state";
import { FileStorageHeader } from "./file-storage-header";
import { FileStorageToolbar } from "./file-storage-toolbar";
import { FileAttachHint } from "./file-attach-hint";
import { FiltersRow } from "./filters-row";
import { FiltersModal } from "./filters-modal";
import { SelectionActionBar } from "./selection-action-bar";
import { FilesTable } from "./table/files-table";
import { FileStoragePagination } from "./file-storage-pagination";
import { FILE_STORAGE_ACTIONS_ROW_CLASS } from "./panel-styles";
import { FilesListState } from "./files-list-state";
import "./files-page.css";
import "./files-responsive-controls.css";
function FileStoragePanel(props) {
  const { mode, attachTarget, projectId, selectedTokenId, onSelectToken, allProjects, onProjectChange, allSheets, onGoToNode } = props;
  const s = useFileStoragePanelState(props);
  const selectionActions = s.canAttach || s.selectedIds.size > 0 ? /* @__PURE__ */ jsx(
    SelectionActionBar,
    {
      selectedCount: s.selectedIds.size,
      canAttach: s.canAttach,
      onAttach: s.attachSelected,
      onDelete: s.deleteSelected,
      onClearSelection: s.clearSelection,
      isDeleting: s.isDeleting
    }
  ) : null;
  const rootClassName = mode === "modal" ? "flex min-h-0 h-full flex-1 flex-col overflow-hidden bg-background" : "files-page flex min-h-0 h-full flex-col gap-3 overflow-auto bg-background p-4 sm:p-6";
  return /* @__PURE__ */ jsxs("div", { className: rootClassName, "data-testid": "file-storage-panel", "data-mode": mode, children: [
    /* @__PURE__ */ jsx(
      FileStorageHeader,
      {
        mode,
        projectId,
        tokens: s.tokens,
        selectedTokenId: selectedTokenId ?? null,
        onSelectToken,
        allProjects,
        onProjectChange,
        onRefresh: s.refresh,
        onUploaded: s.handleUploaded,
        isRefreshing: s.isFetching
      }
    ),
    /* @__PURE__ */ jsx(
      FileStorageToolbar,
      {
        category: s.category,
        onCategoryChange: s.setCategory,
        usedBytes: s.quota.usedBytes,
        s3UsedBytes: s.quota.s3UsedBytes,
        limitBytes: s.quota.limitBytes,
        quotaLoading: s.quota.isLoading
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: mode === "page" ? "files-filter-actions flex shrink-0 flex-wrap items-center justify-between gap-3" : FILE_STORAGE_ACTIONS_ROW_CLASS, children: [
      /* @__PURE__ */ jsx(
        FiltersRow,
        {
          embedded: true,
          filters: s.filters,
          activeCount: s.activeFilterCount,
          onOpen: () => s.setFiltersOpen(true),
          onRemove: s.removeFilter,
          onResetAll: s.resetFilters,
          collaborators: s.collaborators
        }
      ),
      mode === "page" && /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs("label", { className: "files-attach-toggle inline-flex cursor-pointer items-center gap-3 text-sm font-medium", children: [
          /* @__PURE__ */ jsx("span", { children: "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u0435 \u043A \u0431\u043B\u043E\u043A\u0443" }),
          /* @__PURE__ */ jsx(
            Switch,
            {
              checked: s.attachModeEnabled,
              onCheckedChange: s.setAttachModeEnabled,
              "aria-label": "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u0438\u0435 \u043A \u0431\u043B\u043E\u043A\u0443",
              "data-testid": "toggle-attach-mode"
            }
          )
        ] }),
        s.attachModeEnabled && attachTarget && /* @__PURE__ */ jsxs("span", { className: "max-w-[12rem] truncate text-xs text-muted-foreground sm:max-w-xs", children: [
          "\u0426\u0435\u043B\u044C: ",
          /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: attachTarget.nodeLabel })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(FileAttachHint, { mode, attachModeEnabled: s.attachModeEnabled, hasTarget: !!attachTarget, nodeLabel: attachTarget?.nodeLabel, onChooseNode: props.onChooseAttachNode }),
    /* @__PURE__ */ jsx(
      FiltersModal,
      {
        open: s.filtersOpen,
        value: s.filters,
        onApply: s.applyFilters,
        onReset: s.resetFilters,
        onOpenChange: s.setFiltersOpen,
        collaborators: s.collaborators
      }
    ),
    /* @__PURE__ */ jsx("div", { className: mode === "page" ? `files-surface files-content ${!s.files.length ? "min-h-64" : "min-h-48"} flex-1 overflow-auto rounded-xl border` : "min-h-0 flex-1 overflow-auto", "data-testid": "files-table-slot", children: mode === "page" && (s.isLoading || s.isError || !s.files.length) ? /* @__PURE__ */ jsx(
      FilesListState,
      {
        loading: s.isLoading,
        error: s.isError,
        filtered: s.category !== "all" || s.activeFilterCount > 0 || selectedTokenId != null,
        canReset: s.activeFilterCount > 0,
        onRetry: s.refresh,
        onReset: s.resetFilters
      }
    ) : /* @__PURE__ */ jsx(
      FilesTable,
      {
        files: s.files,
        projectId,
        selectedTokenId,
        selectedIds: s.selectedIds,
        onToggleSelect: s.toggleSelect,
        onSelectAll: s.selectAll,
        onCopyFileId: s.copyFileId,
        onDelete: s.deleteOne,
        collaborators: s.collaborators,
        allSheets,
        onGoToNode,
        pageSizeControl: /* @__PURE__ */ jsx(FilePageSize, { value: s.pageSize, onChange: s.setPageSize }),
        selectionActions: mode === "page" ? selectionActions : null,
        isLoading: s.isLoading
      }
    ) }),
    mode === "modal" && selectionActions,
    /* @__PURE__ */ jsx(
      FileStoragePagination,
      {
        pageSize: s.pageSize,
        onPageSizeChange: s.setPageSize,
        page: s.page,
        totalPages: s.totalPages,
        total: s.total,
        onPageChange: (next) => s.setPage(next)
      }
    )
  ] });
}
export {
  FileStoragePanel
};
