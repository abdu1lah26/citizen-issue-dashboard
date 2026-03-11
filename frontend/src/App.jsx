import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
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
import ProtectedRoute from "./components/ProtectedRoute";

import "./App.css";

function App() {
  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/admin/issues"
            element={
              <ProtectedRoute allowedRoles={[2, 3]}>
                <DepartmentIssues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-issues"
            element={
              <ProtectedRoute>
                <MyIssues />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportIssue />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<PublicDashboard />} />
          <Route path="/issues" element={<PublicIssues />} />
          <Route path="/heatmap" element={<PublicHeatmap />} />
          <Route path="/overdue" element={<PublicOverdue />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
