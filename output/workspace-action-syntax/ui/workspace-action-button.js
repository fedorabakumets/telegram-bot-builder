import { jsx } from "react/jsx-runtime";
import { Button } from "./button";
import "./workspace-action-button.css";
function WorkspaceActionButton(props) {
  return /* @__PURE__ */ jsx(Button, { ...props, variant: "outline", "data-workspace-action": "", "data-workspace-size": props.size ?? "default" });
}
export {
  WorkspaceActionButton
};
