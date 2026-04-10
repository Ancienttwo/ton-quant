import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root not found");
}

createRoot(rootElement).render(
  <StrictMode>
    <TonConnectUIProvider manifestUrl={`${window.location.origin}/tonconnect-manifest.json`}>
      <App />
    </TonConnectUIProvider>
  </StrictMode>,
);
