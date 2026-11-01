import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { WorkspaceActionButton as Button } from "@/components/ui/workspace-action-button";
import { useStorageConfigs } from "../hooks/use-storage-configs";
import { listWritable, toStorageInfo } from "./storage/storage-info";
import { StorageTargetSelector } from "./storage/storage-target-selector";
import { FileClipboardButton } from "./file-clipboard-button";
import { useFileUpload } from "./use-file-upload";
function FileUploadButton({
  projectId,
  onUploaded
}) {
  const inputRef = useRef(null);
  const { uploadFiles, isUploading } = useFileUpload(projectId, onUploaded);
  const { configs } = useStorageConfigs();
  const storages = useMemo(() => configs.map(toStorageInfo), [configs]);
  const writable = useMemo(() => listWritable(storages), [storages]);
  const defaultId = writable.find((s) => s.isActive)?.configId ?? writable[0]?.configId ?? "";
  const [overrideId, setOverrideId] = useState(null);
  const targetId = overrideId && writable.some((s) => s.configId === overrideId) ? overrideId : defaultId;
  const openPicker = () => {
    if (!isUploading) inputRef.current?.click();
  };
  const handleChange = (event) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    event.target.value = "";
    void uploadFiles(files, targetId || void 0);
  };
  const handleClipboardFiles = useCallback(
    (files) => {
      void uploadFiles(files, targetId || void 0);
    },
    [targetId, uploadFiles]
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    writable.length > 1 && /* @__PURE__ */ jsx(
      StorageTargetSelector,
      {
        storages,
        value: targetId,
        onChange: setOverrideId,
        disabled: isUploading
      }
    ),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        multiple: true,
        className: "hidden",
        "data-testid": "file-storage-upload-input",
        onChange: handleChange
      }
    ),
    /* @__PURE__ */ jsxs(
      Button,
      {
        type: "button",
        variant: "default",
        size: "sm",
        className: "h-8",
        disabled: isUploading,
        onClick: openPicker,
        title: "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u0430\u0439\u043B\u044B \u0441 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430",
        "data-testid": "file-storage-upload",
        children: [
          isUploading ? /* @__PURE__ */ jsx(Loader2, { className: "h-3.5 w-3.5 sm:mr-1.5 animate-spin" }) : /* @__PURE__ */ jsx(Upload, { className: "h-3.5 w-3.5 sm:mr-1.5" }),
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: isUploading ? "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430\u2026" : "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C" })
        ]
      }
    ),
    /* @__PURE__ */ jsx(FileClipboardButton, { disabled: isUploading, onFiles: handleClipboardFiles })
  ] });
}
export {
  FileUploadButton
};
