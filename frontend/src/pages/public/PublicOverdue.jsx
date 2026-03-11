import { useEffect, useState } from "react";
import API from "../../api/axios";

function PublicOverdue() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverdue = async () => {
      try {
        const response = await API.get("/public/overdue");
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

  if (loading) return <div className="loading">Loading overdue issues...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Overdue Issues</h1>
        <p>Issues that have breached their SLA targets</p>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No Overdue Issues</div>
          <p>All issues are within their SLA targets.</p>
        </div>
      ) : (
        <div className="issue-list">
          {issues.map((issue) => (
            <div key={issue.id} className="issue-card">
              <div className="card-header">
                <h3 className="issue-title">{issue.title}</h3>
                <span
                  className={`badge ${getSeverityClass(issue.severity)}`}
                  style={{
                    background:
                      issue.severity === "critical"
                        ? "#fecaca"
                        : issue.severity === "moderate"
                          ? "#fef3c7"
                          : "#f1f5f9",
                  }}
                >
                  {issue.severity?.toUpperCase()}
                </span>
              </div>

              <div className="issue-meta">
                <div className="issue-meta-item">
                  <span className="badge badge-high">{issue.priority}</span>
                </div>
                <div className="issue-meta-item">
                  Dept: {issue.department_id}
                </div>
                <div className="issue-meta-item">
                  Hours Active: {Number(issue.hours_since_created).toFixed(1)}
                </div>
                <div
                  className="issue-meta-item"
                  style={{ color: "var(--danger)", fontWeight: 600 }}
                >
                  Hours Overdue: {Number(issue.hours_overdue).toFixed(1)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PublicOverdue;
