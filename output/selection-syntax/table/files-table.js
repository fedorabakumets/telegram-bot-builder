import { jsx, jsxs } from "react/jsx-runtime";
import "./files-collection.css";
import { useState } from "react";
import { FilePreviewDialog } from "./file-preview-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EMPTY_STATE_CLASS,
  FILE_CHECKBOX_CLASS,
  STICKY_COLUMN_NAME_HEADER,
  STICKY_COLUMN_SELECT_HEADER,
  TABLE_HEAD_CLASS
} from "../panel-styles";
import { FILES_TABLE_COLUMNS, FILES_TABLE_COLUMN_COUNT } from "./files-table-columns";
import { FileRow } from "./file-row";
import { FileCardPlaceholder } from "./file-card-placeholder";
function isAllSelected(files, selectedIds) {
  return files.length > 0 && files.every((f) => selectedIds.has(f.id));
}
function FilesTable(props) {
  const { files, projectId, selectedIds, onToggleSelect, onSelectAll, onCopyFileId, onDelete, collaborators, selectedTokenId, allSheets, onGoToNode, isLoading } = props;
  const [previewFile, setPreviewFile] = useState(null);
  const allSelected = isAllSelected(files, selectedIds);
  if (isLoading) {
    return /* @__PURE__ */ jsx("div", { className: EMPTY_STATE_CLASS, "data-testid": "files-table-loading", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" });
  }
  if (files.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: EMPTY_STATE_CLASS, "data-testid": "files-table-empty", children: "\u0424\u0430\u0439\u043B\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B" });
  }
  const rowProps = (file) => ({
    file,
    projectId,
    selected: selectedIds.has(file.id),
    selectedTokenId,
    onToggle: () => onToggleSelect(file.id),
    onCopy: onCopyFileId,
    onDelete,
    collaborators,
    allSheets,
    onGoToNode,
    onPreviewClick: () => setPreviewFile(file)
  });
  return /* @__PURE__ */ jsxs("div", { className: "files-collection h-full", "data-testid": "files-table", children: [
    /* @__PURE__ */ jsxs("div", { className: "files-data-table h-full overflow-auto", children: [
      props.pageSizeControl && /* @__PURE__ */ jsx("div", { className: "flex justify-end border-b p-3", children: props.pageSizeControl }),
      props.selectionActions && /* @__PURE__ */ jsx("div", { className: "p-3", children: props.selectionActions }),
      /* @__PURE__ */ jsxs("table", { className: "min-w-full w-max text-xs border-collapse", children: [
        /* @__PURE__ */ jsx("thead", { className: TABLE_HEAD_CLASS, children: /* @__PURE__ */ jsx("tr", { children: FILES_TABLE_COLUMNS.map((col) => /* @__PURE__ */ jsx(
          "th",
          {
            className: [
              "p-2 font-medium whitespace-nowrap",
              col.className ?? "",
              col.id === "select" ? STICKY_COLUMN_SELECT_HEADER : "",
              col.id === "previewName" ? STICKY_COLUMN_NAME_HEADER : ""
            ].join(" "),
            children: col.id === "select" ? /* @__PURE__ */ jsx(
              Checkbox,
              {
                "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435 \u0444\u0430\u0439\u043B\u044B",
                checked: allSelected,
                onCheckedChange: (checked) => onSelectAll(checked),
                className: FILE_CHECKBOX_CLASS,
                "data-testid": "files-table-select-all"
              }
            ) : col.label
          },
          col.id
        )) }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y", children: files.map((file) => /* @__PURE__ */ jsx(FileRow, { ...rowProps(file) }, file.id)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "files-card-list h-full overflow-auto p-3 space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "files-list-controls flex flex-wrap items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm text-muted-foreground px-1", children: [
          /* @__PURE__ */ jsx(
            Checkbox,
            {
              "aria-label": "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435 \u0444\u0430\u0439\u043B\u044B",
              checked: allSelected,
              onCheckedChange: (checked) => onSelectAll(checked),
              className: FILE_CHECKBOX_CLASS
            }
          ),
          "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435 (",
          files.length,
          ")"
        ] }),
        props.pageSizeControl
      ] }),
      props.selectionActions,
      files.map((file) => /* @__PURE__ */ jsx(FileCardPlaceholder, { ...rowProps(file) }, file.id))
    ] }),
    /* @__PURE__ */ jsx(FilePreviewDialog, { file: previewFile, projectId, onClose: () => setPreviewFile(null) }),
    /* @__PURE__ */ jsx("span", { className: "hidden", "aria-hidden": true, "data-column-count": FILES_TABLE_COLUMN_COUNT })
  ] });
}
export {
  FilesTable
};
