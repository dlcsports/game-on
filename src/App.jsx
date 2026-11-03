import { Navigate, Route, Routes } from "react-router-dom";
import { ScorecardPage } from "./pages/ScorecardPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ScorecardPage variant="outdoor" />} />
      <Route path="/indoor" element={<ScorecardPage variant="indoor" />} />
      <Route path="/points" element={<ScorecardPage variant="points" />} />
      <Route path="/house-standings" element={<ScorecardPage variant="standings" />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
