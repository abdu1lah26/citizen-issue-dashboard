import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";

function AdminOverdue() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const response = await API.get("/issues/dashboard/overdue");
        setIssues(response.data.overdue_issues);
      } catch (error) {
        console.error("Overdue fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverdue();
  }, []);

  const getSeverityClass = (severity) => {
    const classes = {
      critical: "severity-critical",
      moderate: "severity-moderate",
    };
    return classes[severity] || "severity-normal";
  };

  const getSeverityStyle = (severity) => {
    if (severity === "critical") {
      return { background: "#fecaca", color: "#991b1b" };
    }
    if (severity === "moderate") {
      return { background: "#fef3c7", color: "#92400e" };
    }
    return { background: "#f1f5f9", color: "#475569" };
  };

  if (loading) return <div className="loading">Loading overdue issues...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Admin - Overdue Issues</h1>
        <p>Issues that have breached their SLA targets (requires action)</p>
      </div>

      <div
        style={{
          marginBottom: "1.5rem",
          padding: "1rem",
          background: "var(--card-bg)",
          borderRadius: "8px",
        }}
      >
        <strong>Total Overdue:</strong> {issues.length} issue
        {issues.length !== 1 ? "s" : ""}
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No Overdue Issues</div>
          <p>All issues are within their SLA targets. Great job!</p>
        </div>
      ) : (
        <div className="issue-list">
          {issues.map((issue) => (
            <div key={issue.id} className="issue-card">
              <div className="card-header">
                <Link
                  to={`/issues/${issue.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <h3 className="issue-title">{issue.title}</h3>
                </Link>
                <span
                  className={`badge ${getSeverityClass(issue.severity)}`}
                  style={getSeverityStyle(issue.severity)}
                >
                  {issue.severity?.toUpperCase()}
                </span>
              </div>

              <div className="issue-meta">
                <div className="issue-meta-item">
                  <span className="badge badge-high">{issue.priority}</span>
                </div>
                <div className="issue-meta-item">
                  <span
                    className={`badge badge-${issue.status?.replace("_", "-")}`}
                  >
                    {issue.status?.replace("_", " ")}
                  </span>
                </div>
                <div className="issue-meta-item">
                  Dept: {issue.department_id}
                </div>
                <div className="issue-meta-item">
                  SLA Target: {issue.sla_hours}h
                </div>
              </div>

              <div
                className="issue-meta"
                style={{ marginTop: "0.5rem", fontWeight: 600 }}
              >
                <div className="issue-meta-item">
                  Hours Active: {Number(issue.hours_since_created).toFixed(1)}
                </div>
                <div
                  className="issue-meta-item"
                  style={{ color: "var(--danger)" }}
                >
                  Hours Overdue: {Number(issue.hours_overdue).toFixed(1)}
                </div>
              </div>

              <div style={{ marginTop: "1rem" }}>
                <Link to={`/issues/${issue.id}`} className="btn-secondary">
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminOverdue;
