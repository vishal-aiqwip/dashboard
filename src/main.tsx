import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import "./styles/index.css"
import App from "./App.tsx"
import { ThemeProvider } from "./lib/theme-provider.tsx"


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider defaultTheme="light" >
      <App />
    </ThemeProvider>
  </StrictMode>
)
