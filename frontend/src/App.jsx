import { Routes, Route } from "react-router-dom";

// Public Pages
import PublicDashboard from "./pages/public/PublicDashboard";
import PublicIssues from "./pages/public/PublicIssues";
import PublicHeatmap from "./pages/public/PublicHeatmap";
import PublicOverdue from "./pages/public/PublicOverdue";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/issues" element={<PublicIssues />} />
      <Route path="/heatmap" element={<PublicHeatmap />} />
      <Route path="/overdue" element={<PublicOverdue />} />
    </Routes>
  );
}

export default App;