import { createBrowserRouter } from "react-router";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { EditorScreen } from "./components/EditorScreen";
import { VersionControlScreen } from "./components/VersionControlScreen";
import { AskBoxScreen } from "./components/AskBoxScreen";
import { Root } from "./components/Root";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: WelcomeScreen },
      { path: "editor", Component: EditorScreen },
      { path: "version-control", Component: VersionControlScreen },
    ],
  },
  { path: "/ask-box", Component: AskBoxScreen },
]);
