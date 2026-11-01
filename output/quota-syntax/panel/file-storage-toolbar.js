import { jsx, jsxs } from "react/jsx-runtime";
import { CategoryTabs } from "./category-tabs";
import { StorageQuotaBar } from "./storage-quota-bar";
import { FILE_STORAGE_TOOLBAR_CLASS } from "./panel-styles";
function FileStorageToolbar({
  category,
  onCategoryChange,
  usedBytes,
  s3UsedBytes,
  limitBytes,
  quotaLoading
}) {
  return /* @__PURE__ */ jsxs("div", { className: FILE_STORAGE_TOOLBAR_CLASS, "data-testid": "file-storage-toolbar", children: [
    /* @__PURE__ */ jsx(CategoryTabs, { category, onCategoryChange, embedded: true }),
    /* @__PURE__ */ jsx(
      StorageQuotaBar,
      {
        usedBytes,
        s3UsedBytes,
        limitBytes,
        isLoading: quotaLoading,
        compact: true
      }
    )
  ] });
}
export {
  FileStorageToolbar
};
