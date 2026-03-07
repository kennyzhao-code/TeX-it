import { createBrowserRouter } from "react-router";
import { EditorScreen } from "./components/EditorScreen";

import { AskBoxScreen } from "./components/AskBoxScreen";
import { Root } from "./components/Root";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: EditorScreen },

    ],
  },
  { path: "/ask-box", Component: AskBoxScreen },
]);
