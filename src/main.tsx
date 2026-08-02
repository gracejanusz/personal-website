import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./app/App.tsx";
import Photos from "./app/Photos.tsx";
import Projects from "./app/Projects.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/photos" element={<Photos />} />
      <Route path="/projects" element={<Projects />} />
    </Routes>
  </BrowserRouter>,
);
