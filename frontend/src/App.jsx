import { Routes, Route } from "react-router-dom";
import ReportIssue from "./pages/citizen/ReportIssue";
import MyIssues from "./pages/citizen/MyIssues";

// Public Pages
import PublicDashboard from "./pages/public/PublicDashboard";
import PublicIssues from "./pages/public/PublicIssues";
import PublicHeatmap from "./pages/public/PublicHeatmap";
import PublicOverdue from "./pages/public/PublicOverdue";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import DepartmentIssues from "./pages/admin/DepartmentIssues";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/admin/issues" element={<DepartmentIssues />} />
      <Route path="/my-issues" element={<MyIssues />} />
      <Route path="/report" element={<ReportIssue />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PublicDashboard />} />
      <Route path="/issues" element={<PublicIssues />} />
      <Route path="/heatmap" element={<PublicHeatmap />} />
      <Route path="/overdue" element={<PublicOverdue />} />
    </Routes>
  );
}

export default App;
