// src/App.jsx
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./modules/auth";
import { ThemeProvider } from "./core/context/ThemeContext";
import AppRoutes from "./core/routes/AppRoutes";
import { Toaster } from "react-hot-toast";

function App() {
  console.log("App: Renderizando App.jsx");
  return (
    <AuthProvider>
      <BrowserRouter>
        <ThemeProvider>
          <Toaster position="top-right" />
          <AppRoutes />
        </ThemeProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;