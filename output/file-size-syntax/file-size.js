import { jsx } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatSize } from "./files-table-utils";
import { updateFileSizeCache } from "./file-size-cache";
function FileSize({ file, projectId }) {
  const client = useQueryClient();
  const root = useRef(null);
  const [visible, setVisible] = useState(false);
  const missing = !file.fileSize && file.source !== "uploaded" && !!file.fileId;
  useEffect(() => {
    if (!missing || !root.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { rootMargin: "100px" });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [missing]);
  const { data, isFetching } = useQuery({
    queryKey: ["message-file-size", projectId, file.id, file.fileId],
    enabled: visible && missing,
    staleTime: (query) => query.state.data?.fileSize ? Infinity : 15e3,
    retry: 1,
    refetchInterval: (query) => visible && missing && !query.state.data?.fileSize ? 15e3 : false,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const result = await fetch(`/api/projects/${projectId}/messages/${file.id}/file-size`, { credentials: "include" });
      if (!result.ok) throw new Error("\u0420\u0430\u0437\u043C\u0435\u0440 \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u043E \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D");
      const value = await result.json();
      if (value.fileSize) updateFileSizeCache(client, projectId, file, value.fileSize);
      return value;
    }
  });
  const size = file.fileSize || data?.fileSize;
  return /* @__PURE__ */ jsx("span", { ref: root, title: !size ? "\u0420\u0430\u0437\u043C\u0435\u0440 \u043D\u0435 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D; \u0443\u0442\u043E\u0447\u043D\u044F\u0435\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 Telegram" : void 0, children: size ? formatSize(size) : isFetching ? "\u0423\u0442\u043E\u0447\u043D\u044F\u0435\u043C \u0440\u0430\u0437\u043C\u0435\u0440\u2026" : "\u0420\u0430\u0437\u043C\u0435\u0440 \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u0435\u043D" });
}
export {
  FileSize
};
