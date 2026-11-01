import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { getNodePhotoFiles } from "./node-photo-files";
import { MediaThumbnail } from "./table/media-thumbnail";
import { FilePreviewDialog } from "./table/file-preview-dialog";
function NodePhotoGallery({ projectId, target, sheets, tokenId }) {
  const [preview, setPreview] = useState(null);
  const node = target && sheets.flatMap((sheet) => sheet.nodes).find((item) => item.id === target.nodeId);
  if (!node) return null;
  const photos = getNodePhotoFiles(node.data, tokenId);
  return /* @__PURE__ */ jsxs("section", { "aria-label": "\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438 \u0432 \u0431\u043B\u043E\u043A\u0435", className: "space-y-2 border-t pt-3", children: [
    /* @__PURE__ */ jsxs("p", { className: "text-sm font-medium text-foreground", children: [
      "\u0424\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0438 \u0432 \u0431\u043B\u043E\u043A\u0435 \xB7 ",
      photos.length
    ] }),
    photos.length ? /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: photos.map((photo) => /* @__PURE__ */ jsx(
      "button",
      {
        type: "button",
        "aria-label": `\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0444\u043E\u0442\u043E ${photo.id + 1} \u0431\u043B\u043E\u043A\u0430`,
        title: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043D\u0430 \u0432\u0435\u0441\u044C \u044D\u043A\u0440\u0430\u043D",
        className: "h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-muted hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary",
        onClick: () => setPreview(photo),
        children: /* @__PURE__ */ jsx(MediaThumbnail, { file: photo, projectId }, `${target?.nodeId}:${photo.url ?? photo.fileId}`)
      },
      photo.id
    )) }) : /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "\u0412 \u044D\u0442\u043E\u043C \u0431\u043B\u043E\u043A\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0444\u043E\u0442\u043E\u0433\u0440\u0430\u0444\u0438\u0439." }),
    /* @__PURE__ */ jsx(FilePreviewDialog, { file: preview, projectId, onClose: () => setPreview(null) }, `${target?.nodeId}:${preview?.id ?? "closed"}`)
  ] });
}
export {
  NodePhotoGallery
};
