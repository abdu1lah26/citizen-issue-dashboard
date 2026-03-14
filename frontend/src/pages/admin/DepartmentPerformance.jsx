import { useEffect, useState } from "react";
import API from "../../api/axios";

function DepartmentPerformance() {
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await API.get("/users/departments");
        const depts = res.data.departments || [];
        setDepartments(depts);
        if (depts.length > 0) {
          setSelectedDepartment(depts[0].id);
        }
      } catch (err) {
        console.error("Fetch departments failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDepartment === null) return;

    const fetchStats = async () => {
      try {
        const res = await API.get(
          `/issues/department/${selectedDepartment}/performance`,
        );
        setStats(res.data.stats);
      } catch (err) {
        console.error("Fetch performance stats failed", err);
      }
    };

    fetchStats();
  }, [selectedDepartment]);

  if (loading) return <div className="loading">Loading...</div>;

  if (departments.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1>Department Performance</h1>
        </div>
        <div className="empty-state">
          <div className="empty-state-title">No Department Assigned</div>
          <p>You are not assigned to any department.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Department Performance</h1>
        <p>View statistics for your department</p>
      </div>

      {departments.length > 1 && (
        <div className="form-group" style={{ marginBottom: "1.5rem" }}>
          <label className="form-label">Select Department</label>
          <select
            value={selectedDepartment || ""}
            onChange={(e) => setSelectedDepartment(Number(e.target.value))}
            style={{ padding: "0.5rem", borderRadius: "4px" }}
          >
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total_issues}</div>
            <div className="stat-label">Total Issues</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--success)" }}>
              {stats.resolved_issues}
            </div>
            <div className="stat-label">Resolved</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: "var(--warning)" }}>
              {stats.pending_issues}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {stats.avg_resolution_hours
                ? Number(stats.avg_resolution_hours).toFixed(1)
                : "N/A"}
            </div>
            <div className="stat-label">Avg Resolution (hrs)</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentPerformance;
