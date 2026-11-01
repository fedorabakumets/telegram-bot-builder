import { jsx } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { FileStoragePanel } from "../panel/file-storage-panel";
import { mergeAttachedMedia } from "../panel/attach-node-refs";
function FilesTabPage({
  projectId,
  selectedTokenId,
  onSelectToken,
  allProjects,
  onProjectChange,
  onNodeUpdate,
  allSheets,
  attachTarget: canvasTarget = null,
  onSwitchToCanvas,
  onFocusNode,
  onSetActiveSheet,
  onSelectNode
}) {
  const { toast } = useToast();
  const [chosen, setChosen] = useState(null);
  const chosenNode = chosen?.projectId === projectId ? allSheets?.flatMap((sheet) => sheet.nodes).find((node) => node.id === chosen.nodeId) : null;
  const attachTarget = chosenNode ? {
    nodeId: chosenNode.id,
    nodeLabel: String(chosenNode.data.messageText || chosenNode.id).replace(/<[^>]*>/g, "").slice(0, 80),
    field: "attachedMedia",
    multi: true
  } : chosen?.projectId === projectId && chosen.nodeId === null ? null : canvasTarget;
  const handleGoToNode = useCallback(
    (nodeId, sheetId) => {
      onSwitchToCanvas?.();
      if (onFocusNode) {
        onFocusNode(nodeId);
        return;
      }
      onSetActiveSheet?.(sheetId);
      onSelectNode?.(nodeId);
    },
    [onSwitchToCanvas, onFocusNode, onSetActiveSheet, onSelectNode]
  );
  const handleAttach = useCallback(
    (fileRefs) => {
      if (!onNodeUpdate || !allSheets || !attachTarget || fileRefs.length === 0) return;
      const node = allSheets.flatMap((s) => s.nodes).find((n) => n.id === attachTarget.nodeId);
      if (!node) return;
      const current = Array.isArray(node.data.attachedMedia) ? node.data.attachedMedia : [];
      const merged = mergeAttachedMedia(current, fileRefs, attachTarget.multi);
      onNodeUpdate(attachTarget.nodeId, { attachedMedia: merged });
      toast({ title: `\u0424\u0430\u0439\u043B\u044B \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u044B \u043A \u043D\u043E\u0434\u0435 \xAB${attachTarget.nodeLabel}\xBB` });
    },
    [onNodeUpdate, allSheets, attachTarget, toast]
  );
  return /* @__PURE__ */ jsx(
    FileStoragePanel,
    {
      mode: "page",
      projectId,
      selectedTokenId,
      onSelectToken,
      allProjects,
      onProjectChange,
      attachTarget,
      onAttach: handleAttach,
      allSheets,
      onGoToNode: handleGoToNode,
      onChooseAttachNode: onSwitchToCanvas,
      onSelectAttachNode: onNodeUpdate ? (nodeId) => setChosen({ projectId, nodeId }) : void 0
    }
  );
}
export {
  FilesTabPage
};
