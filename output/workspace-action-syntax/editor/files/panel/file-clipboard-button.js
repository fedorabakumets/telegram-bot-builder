import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from "react";
import { ClipboardPaste } from "lucide-react";
import { WorkspaceActionButton as Button } from "@/components/ui/workspace-action-button";
import { useToast } from "@/hooks/use-toast";
import {
  filesFromClipboardEvent,
  isClipboardDenied,
  isPasteHotkey,
  readClipboardFiles
} from "./read-clipboard-files";
const AWAIT_PASTE_MS = 15e3;
function FileClipboardButton({
  disabled = false,
  onFiles,
  compact = false
}) {
  const { toast } = useToast();
  const catcherRef = useRef(null);
  const [awaitingPaste, setAwaitingPaste] = useState(false);
  useEffect(() => {
    if (!awaitingPaste) return void 0;
    const timer = window.setTimeout(() => setAwaitingPaste(false), AWAIT_PASTE_MS);
    catcherRef.current?.focus();
    return () => window.clearTimeout(timer);
  }, [awaitingPaste]);
  useEffect(() => {
    const onPaste = (event) => {
      if (disabled) return;
      const el = event.target;
      const inField = el?.closest('input, textarea, [contenteditable="true"]');
      const inCatcher = el?.closest("[data-clipboard-catcher]");
      if (inField && !inCatcher && !awaitingPaste) return;
      const files = filesFromClipboardEvent(event);
      if (files.length === 0) return;
      event.preventDefault();
      event.stopPropagation();
      setAwaitingPaste(false);
      onFiles(files);
    };
    document.addEventListener("paste", onPaste, true);
    return () => document.removeEventListener("paste", onPaste, true);
  }, [awaitingPaste, disabled, onFiles]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if (disabled || !isPasteHotkey(event)) return;
      const el = event.target;
      const inCatcher = el?.closest("[data-clipboard-catcher]");
      const inField = el?.closest('input, textarea, [contenteditable="true"]');
      if (inField && !inCatcher) return;
      catcherRef.current?.focus();
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [disabled]);
  const handleClick = async () => {
    try {
      const files = await readClipboardFiles();
      if (files.length === 0) {
        toast({
          title: "\u0412 \u0431\u0443\u0444\u0435\u0440\u0435 \u043D\u0435\u0442 \u0444\u0430\u0439\u043B\u0430",
          description: "\u0421\u043A\u043E\u043F\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u043A\u0440\u0438\u043D\u0448\u043E\u0442 \u0438 \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Ctrl+V \u0438\u043B\u0438 Ctrl+\u041C"
        });
        setAwaitingPaste(true);
        return;
      }
      onFiles(files);
    } catch (error) {
      setAwaitingPaste(true);
      toast({
        title: "\u041D\u0430\u0436\u043C\u0438\u0442\u0435 Ctrl+V \u0438\u043B\u0438 Ctrl+\u041C",
        description: isClipboardDenied(error) ? "\u0411\u0440\u0430\u0443\u0437\u0435\u0440 \u043D\u0435 \u0434\u0430\u0451\u0442 \u0447\u0438\u0442\u0430\u0442\u044C \u0431\u0443\u0444\u0435\u0440 \u043D\u0430\u043F\u0440\u044F\u043C\u0443\u044E \u2014 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0441\u043E\u0447\u0435\u0442\u0430\u043D\u0438\u0435\u043C \u043A\u043B\u0430\u0432\u0438\u0448" : "\u0412\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0441\u043A\u0440\u0438\u043D\u0448\u043E\u0442 \u0438\u043B\u0438 \u0444\u0430\u0439\u043B: Ctrl+V, Ctrl+\u041C \u0438\u043B\u0438 Shift+Insert"
      });
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: catcherRef,
        "data-clipboard-catcher": "true",
        contentEditable: true,
        tabIndex: -1,
        className: "sr-only",
        "aria-hidden": true
      }
    ),
    /* @__PURE__ */ jsxs(
      Button,
      {
        type: "button",
        variant: awaitingPaste ? "default" : "outline",
        size: compact ? "icon" : "sm",
        className: compact ? "h-10 w-10 shrink-0" : "h-8",
        disabled,
        onClick: () => void handleClick(),
        title: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0438\u0437 \u0431\u0443\u0444\u0435\u0440\u0430: Ctrl+V, Ctrl+\u041C \u0438\u043B\u0438 Shift+Insert",
        "data-testid": "file-storage-upload-clipboard",
        children: [
          /* @__PURE__ */ jsx(ClipboardPaste, { className: compact ? "h-4 w-4" : "h-3.5 w-3.5 sm:mr-1.5" }),
          !compact && /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: awaitingPaste ? "Ctrl+V / \u041C" : "\u0418\u0437 \u0431\u0443\u0444\u0435\u0440\u0430" })
        ]
      }
    )
  ] });
}
export {
  FileClipboardButton
};
