import { jsx, jsxs } from "react/jsx-runtime";
import { FolderOpen } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ProjectOptionLabel } from "./project-name-label";
import "./project-selector.css";
function ProjectSelector({
  projects,
  selectedProjectId,
  onSelect
}) {
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 min-w-0 shrink-0", children: [
    /* @__PURE__ */ jsx(FolderOpen, { className: "w-3.5 h-3.5 text-muted-foreground flex-shrink-0" }),
    /* @__PURE__ */ jsxs(
      Select,
      {
        value: String(selectedProjectId),
        onValueChange: (value) => onSelect(Number(value)),
        children: [
          /* @__PURE__ */ jsx(SelectTrigger, { className: "h-8 text-xs border-border/60 bg-background min-w-[120px] w-auto max-w-[280px]", children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "\u041F\u0440\u043E\u0435\u043A\u0442", children: selectedProject?.name }) }),
          /* @__PURE__ */ jsx(SelectContent, { className: "project-selector-menu", align: "start", collisionPadding: 12, children: projects.map((project) => /* @__PURE__ */ jsx(
            SelectItem,
            {
              value: String(project.id),
              className: "py-2 pr-3",
              textValue: project.name,
              children: /* @__PURE__ */ jsx(ProjectOptionLabel, { name: project.name, id: project.id, className: "project-selector-option" })
            },
            project.id
          )) })
        ]
      }
    )
  ] });
}
export {
  ProjectSelector
};
