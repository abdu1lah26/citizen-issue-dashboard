import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import ReportIssue from "./pages/citizen/ReportIssue";
import MyIssues from "./pages/citizen/MyIssues";
import IssueDetail from "./pages/citizen/IssueDetail";

// Public Pages
import PublicDashboard from "./pages/public/PublicDashboard";
import PublicIssues from "./pages/public/PublicIssues";
import PublicHeatmap from "./pages/public/PublicHeatmap";
import PublicOverdue from "./pages/public/PublicOverdue";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

// Admin Pages
import DepartmentIssues from "./pages/admin/DepartmentIssues";
import DepartmentPerformance from "./pages/admin/DepartmentPerformance";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOverdue from "./pages/admin/AdminOverdue";
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
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={[2, 3]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/overdue"
            element={
              <ProtectedRoute allowedRoles={[2, 3]}>
                <AdminOverdue />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/performance"
            element={
              <ProtectedRoute allowedRoles={[2, 3]}>
                <DepartmentPerformance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/issues/:id"
            element={
              <ProtectedRoute>
                <IssueDetail />
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
