import React from "react";
import { createRoot } from "react-dom/client";
import dayjs from "dayjs";
import "dayjs/locale/es";
import "survey-creator-core/survey-creator-core.min.css";
import "survey-core/survey-core.min.css";

import App from "./App";
import { RootErrorBoundary } from "./components";
import "./styles/global.css";
import "./survey";
import { initializeDeviceMode } from "./utils/device-mode";

dayjs.locale("es");
initializeDeviceMode();

const container = document.getElementById("root") as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>
);
