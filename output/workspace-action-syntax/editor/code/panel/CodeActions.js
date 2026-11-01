import { jsx, jsxs } from "react/jsx-runtime";
import { WorkspaceActionButton as Button } from "@/components/ui/workspace-action-button";
import { useToast } from "@/hooks/use-toast";
function CodeActions({ content, selectedFormat, fileName, isLoading }) {
  const { toast } = useToast();
  const unavailable = !!isLoading || !content.trim() || content.startsWith("# \u041E\u0448\u0438\u0431\u043A\u0430");
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: "\u041A\u043E\u0434 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D", description: "\u041C\u043E\u0436\u043D\u043E \u0432\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0435\u0433\u043E \u0432 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440." });
    } catch {
      toast({ title: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C", description: "\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F \u043A \u0431\u0443\u0444\u0435\u0440\u0443 \u043E\u0431\u043C\u0435\u043D\u0430 \u0438\u043B\u0438 \u0441\u043A\u0430\u0447\u0430\u0439\u0442\u0435 \u0444\u0430\u0439\u043B.", variant: "destructive" });
    }
  };
  const handleDownload = () => {
    const extensions = {
      python: ".py",
      json: ".json",
      requirements: ".txt",
      readme: ".md",
      dockerfile: "",
      env: ""
    };
    const names = {
      python: fileName,
      json: `${fileName}_data`,
      requirements: `requirements_${fileName}`,
      readme: `README_${fileName}`,
      dockerfile: `Dockerfile_${fileName}`,
      env: `.env_${fileName}`
    };
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = names[selectedFormat] + extensions[selectedFormat];
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "\u0424\u0430\u0439\u043B \u0441\u043A\u0430\u0447\u0430\u043D", description: `\u0424\u0430\u0439\u043B ${link.download} \u0443\u0441\u043F\u0435\u0448\u043D\u043E \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D` });
  };
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
    /* @__PURE__ */ jsx(Button, { onClick: handleCopy, disabled: unavailable, variant: "outline", className: "code-action w-full px-3 text-sm font-semibold", "data-testid": "button-copy-code", children: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C" }),
    /* @__PURE__ */ jsx(Button, { onClick: handleDownload, disabled: unavailable, className: "code-action w-full px-3 text-sm font-semibold", "data-testid": "button-download-code", children: "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0444\u0430\u0439\u043B" })
  ] });
}
export {
  CodeActions
};
