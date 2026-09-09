import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "@fontsource/be-vietnam-pro/400.css";
import "@fontsource/be-vietnam-pro/500.css";
import "@fontsource/be-vietnam-pro/600.css";
import "@fontsource/be-vietnam-pro/700.css";
import "react-toastify/dist/ReactToastify.css";
import App from "./App";
import { store } from "./store";
import { ThemeProvider, useTheme } from "./ThemeContext";
import { AuthProvider } from "./AuthContext";
import { PageSettingsProvider } from "./PageSettingsContext";
import "./index.css";

function AppToasts() {
  const { theme } = useTheme();
  return <ToastContainer
    position="top-right"
    autoClose={3200}
    newestOnTop
    pauseOnFocusLoss={false}
    hideProgressBar={false}
    closeOnClick
    theme={theme}
    toastClassName="modern-toast"
    progressClassName="modern-toast-progress"
  />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <AuthProvider>
            <PageSettingsProvider>
              <App />
              <AppToasts />
            </PageSettingsProvider>
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
