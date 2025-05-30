import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import Home from "./components/home";
import routes from "tempo-routes";
import appRoutes from "./routes";
import { ThemeProvider } from "./components/theme-provider";

function App() {
  return (
    <ThemeProvider defaultTheme="system" enableSystem>
      <Suspense fallback={<p>Loading...</p>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/widget-builder" element={<Home />} />
          <Route path="/ai-providers" element={<Home />} />
          <Route path="/analytics" element={<Home />} />
          <Route path="/users" element={<Home />} />
          <Route path="/settings" element={<Home />} />
          {/* Add this before the catchall route */}
          {import.meta.env.VITE_TEMPO === "true" && (
            <Route path="/tempobook/*" />
          )}
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
        {useRoutes(appRoutes)}
      </Suspense>
    </ThemeProvider>
  );
}

export default App;
