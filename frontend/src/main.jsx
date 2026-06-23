import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch((err) => {
      console.error("Service worker registration failed:", err);
    });
  });
}


// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import Maintenance from "./Maintenance.jsx";

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//     <Maintenance />
//   </StrictMode>
// );

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker.register("/service-worker.js").catch((err) => {
//       console.error("Service worker registration failed:", err);
//     });
//   });
// }