import { jsx, jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkspaceActionButton } from "@/components/ui/workspace-action-button";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { useUpdateProjectName } from "@/components/editor/bot/project/use-update-project-name";
import { BotValidation } from "../types/bot-validation";
import { CodePanelHeader } from "./CodePanelHeader";
import { CodeFormatTabs } from "./CodeFormatTabs";
import { CodeActions } from "./CodeActions";
import { CodeStats } from "./CodeStats";
import { JsonApplyBar } from "./JsonApplyBar";
import "./code-panel.css";
import { useOpenCodeView } from "@/components/layout/flexible/components/code-view-navigation";
function CodePanel({
  botDataArray,
  projectIds,
  projectName,
  onClose,
  selectedFormat: externalSelectedFormat,
  onFormatChange,
  areAllCollapsed,
  onCollapseChange,
  onShowFullCodeChange,
  onBotDataUpdate,
  codeContent,
  isLoading,
  displayContent,
  onApplyJson,
  editedContent,
  onResetEditor
}) {
  const openCodeView = useOpenCodeView();
  const [localSelectedFormat, setLocalSelectedFormat] = useState("python");
  const [localAreAllCollapsed, setLocalAreAllCollapsed] = useState(true);
  const [projectNames, setProjectNames] = useState(
    () => botDataArray.map((_, i) => projectName || `\u041F\u0440\u043E\u0435\u043A\u0442 ${i + 1}`)
  );
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingValue, setEditingValue] = useState("");
  const inputRef = useRef(null);
  const [jsonError, setJsonError] = useState(null);
  const updateProjectNameMutation = useUpdateProjectName();
  const selectedFormat = externalSelectedFormat ?? localSelectedFormat;
  const collapseState = areAllCollapsed ?? localAreAllCollapsed;
  useEffect(() => {
    if (!editedContent || selectedFormat !== "json") {
      setJsonError(null);
      return;
    }
    try {
      JSON.parse(editedContent);
      setJsonError(null);
    } catch (e) {
      setJsonError(e instanceof Error ? e.message : "\u041D\u0435\u0432\u0430\u043B\u0438\u0434\u043D\u044B\u0439 JSON");
    }
  }, [editedContent, selectedFormat]);
  const handleFormatChange = (format) => {
    onFormatChange ? onFormatChange(format) : setLocalSelectedFormat(format);
    setJsonError(null);
    openCodeView?.();
  };
  const handleCollapseChange = (collapsed) => {
    onCollapseChange ? onCollapseChange(collapsed) : setLocalAreAllCollapsed(collapsed);
  };
  const { data: _project } = useQuery({
    queryKey: [`/api/projects/${projectIds?.[0]}`],
    enabled: !!projectIds?.[0],
    staleTime: 1e3 * 60 * 5
  });
  const startEditing = (index) => {
    setEditingIndex(index);
    setEditingValue(projectNames[index] || projectName || `\u041F\u0440\u043E\u0435\u043A\u0442 ${index + 1}`);
    setTimeout(() => inputRef.current?.select(), 0);
  };
  const commitEdit = (index) => {
    const newName = editingValue.trim();
    if (newName && newName !== projectNames[index]) {
      setProjectNames((prev) => {
        const n = [...prev];
        n[index] = newName;
        return n;
      });
      const projectId = projectIds?.[index];
      if (projectId) updateProjectNameMutation.mutate({ projectId, name: newName });
      if (onBotDataUpdate) onBotDataUpdate(botDataArray, index, newName);
    }
    setEditingIndex(null);
  };
  const handleApplyJson = (index) => {
    if (!editedContent || jsonError) return;
    onApplyJson?.(editedContent, index);
  };
  const handleResetJson = () => {
    setJsonError(null);
    onResetEditor?.();
  };
  const getCurrentContent = (_index) => {
    if (displayContent) return displayContent;
    if (codeContent && codeContent[selectedFormat]) return codeContent[selectedFormat];
    return "";
  };
  const getFormatIcon = (format) => ({
    python: "fab fa-python text-blue-500",
    json: "fas fa-database text-green-500",
    requirements: "fas fa-list text-orange-500",
    readme: "fas fa-file-alt text-purple-500",
    dockerfile: "fab fa-docker text-cyan-500",
    env: "fas fa-lock text-red-500"
  })[format];
  const getFormatLabel = (format) => ({
    python: "Python \u043A\u043E\u0434",
    json: "JSON \u0434\u0430\u043D\u043D\u044B\u0435",
    requirements: "Requirements.txt",
    readme: "README.md",
    dockerfile: "Dockerfile",
    env: ".env"
  })[format];
  return /* @__PURE__ */ jsx("div", { className: "code-panel code-panel-scroll h-full overflow-auto bg-background", children: /* @__PURE__ */ jsx("div", { className: "code-panel-padding p-4 sm:p-6", children: /* @__PURE__ */ jsxs("div", { className: "code-panel-stack mx-auto max-w-3xl space-y-6", children: [
    /* @__PURE__ */ jsx(CodePanelHeader, {}),
    botDataArray.map((_botData, index) => {
      const content = getCurrentContent(index);
      const currentProjectName = projectNames[index] || projectName || `\u041F\u0440\u043E\u0435\u043A\u0442 ${index + 1}`;
      const projectIdSuffix = projectIds?.[index] ? ` (ID: ${projectIds[index]})` : "";
      const safeFileName = currentProjectName.replace(/[^a-zA-Z0-9_-]/g, "_");
      return /* @__PURE__ */ jsxs(Card, { className: "code-surface rounded-2xl border shadow-none", children: [
        /* @__PURE__ */ jsx(CardHeader, { className: "code-project-header space-y-2 p-4 sm:p-6", children: /* @__PURE__ */ jsx("div", { className: "flex items-start gap-2 xs:gap-2.5 justify-between min-w-0", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 xs:gap-2 min-w-0", children: [
          /* @__PURE__ */ jsx("div", { className: "w-6 xs:w-7 h-6 xs:h-7 rounded-md flex items-center justify-center flex-shrink-0 bg-muted/50", children: /* @__PURE__ */ jsx("i", { className: `${getFormatIcon(selectedFormat)} text-xs xs:text-sm` }) }),
          /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
            editingIndex === index ? /* @__PURE__ */ jsx(
              "input",
              {
                ref: inputRef,
                className: "text-sm xs:text-base font-semibold bg-transparent border-b border-primary outline-none w-full",
                value: editingValue,
                onChange: (e) => setEditingValue(e.target.value),
                onBlur: () => commitEdit(index),
                onKeyDown: (e) => {
                  if (e.key === "Enter") commitEdit(index);
                  if (e.key === "Escape") setEditingIndex(null);
                }
              }
            ) : /* @__PURE__ */ jsx(
              CardTitle,
              {
                className: "code-project-title cursor-pointer break-words text-base font-semibold",
                onDoubleClick: () => startEditing(index),
                title: `${currentProjectName}. \u0414\u0432\u043E\u0439\u043D\u043E\u0439 \u043A\u043B\u0438\u043A \u0434\u043B\u044F \u043F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u044F`,
                children: currentProjectName
              }
            ),
            /* @__PURE__ */ jsxs(CardDescription, { className: "mt-1 text-xs", children: [
              getFormatLabel(selectedFormat),
              projectIdSuffix ? ` \xB7 \u041F\u0440\u043E\u0435\u043A\u0442 ${projectIds?.[index]}` : ""
            ] })
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsxs(CardContent, { className: "code-project-content space-y-4 p-4 pt-0 sm:p-6 sm:pt-0", children: [
          /* @__PURE__ */ jsx(BotValidation, { botData: botDataArray[index] }),
          openCodeView && /* @__PURE__ */ jsxs(WorkspaceActionButton, { onClick: openCodeView, className: "code-action w-full px-3 text-base font-semibold", children: [
            "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u043A\u043E\u0434 ",
            /* @__PURE__ */ jsx("span", { "aria-hidden": "true", children: "\u2192" })
          ] }),
          /* @__PURE__ */ jsx(CodeActions, { content, selectedFormat, fileName: safeFileName, isLoading }),
          /* @__PURE__ */ jsx(CodeFormatTabs, { selectedFormat, projectName: currentProjectName, onFormatChange: handleFormatChange }),
          selectedFormat === "json" && !editedContent && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 px-3 py-2 rounded-md bg-muted/40 border border-border/40", children: [
            /* @__PURE__ */ jsx("i", { className: "fas fa-info-circle text-xs text-muted-foreground/60 mt-0.5 flex-shrink-0" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground leading-relaxed", children: [
              "\u0417\u0434\u0435\u0441\u044C \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0441\u0442\u0440\u0443\u043A\u0442\u0443\u0440\u0430 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u044F \u0431\u043E\u0442\u0430. \u041E\u0442\u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u0443\u0439\u0442\u0435 JSON \u0432 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435 \u0441\u043F\u0440\u0430\u0432\u0430 \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435",
              " ",
              /* @__PURE__ */ jsx("span", { className: "font-medium text-foreground/80", children: "\xAB\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C\xBB" }),
              " \u2014 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0432\u0441\u0442\u0443\u043F\u044F\u0442 \u0432 \u0441\u0438\u043B\u0443."
            ] })
          ] }),
          selectedFormat === "json" && /* @__PURE__ */ jsx(
            JsonApplyBar,
            {
              isDirty: !!editedContent && editedContent !== content,
              error: jsonError,
              onApply: () => handleApplyJson(index),
              onReset: handleResetJson
            }
          ),
          /* @__PURE__ */ jsx(
            CodeStats,
            {
              content,
              selectedFormat,
              isLoading: !!isLoading,
              collapseState,
              onToggleCollapse: () => handleCollapseChange(!collapseState),
              onShowFullCode: onShowFullCodeChange ? () => onShowFullCodeChange(true) : void 0
            }
          )
        ] })
      ] }, index);
    })
  ] }) }) });
}
export {
  CodePanel
};
