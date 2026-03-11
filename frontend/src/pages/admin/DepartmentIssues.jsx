import { useEffect, useState } from "react";
import API from "../../api/axios";
import IssueTimeline from "../../components/IssueTimeline";

function DepartmentIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  const departmentId = 1; // temporary

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await API.get(`/issues/department/${departmentId}`);
        setIssues(res.data.issues);
      } catch (err) {
        console.error("Fetch department issues failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

  const updateStatus = async (issueId, status) => {
    try {
      await API.patch(`/issues/${issueId}/status`, {
        status,
      });

      alert("Status updated");

      // refresh list
      const res = await API.get(`/issues/department/${departmentId}`);
      setIssues(res.data.issues);
    } catch (err) {
      console.error("Status update failed", err);
      alert("Update failed");
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: "badge badge-pending",
      in_progress: "badge badge-in-progress",
      resolved: "badge badge-resolved",
    };
    return badges[status] || "badge";
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      low: "badge badge-low",
      medium: "badge badge-medium",
      high: "badge badge-high",
      critical: "badge badge-critical",
    };
    return badges[priority] || "badge";
  };

  if (loading)
    return <div className="loading">Loading department issues...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Department Issues</h1>
        <p>Manage and update issues assigned to your department</p>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No Issues Assigned</div>
          <p>There are no issues assigned to this department.</p>
        </div>
      ) : (
        <div className="issue-list">
          {issues.map((issue) => (
            <div key={issue.id} className="issue-card">
              <h3 className="issue-title">{issue.title}</h3>

              <p className="issue-description">{issue.description}</p>

              <div className="issue-meta">
                <div className="issue-meta-item">
                  <span className={getStatusBadge(issue.status)}>
                    {issue.status?.replace("_", " ")}
                  </span>
                </div>
                <div className="issue-meta-item">
                  <span className={getPriorityBadge(issue.priority)}>
                    {issue.priority}
                  </span>
                </div>
                <div className="issue-meta-item">
                  Created: {new Date(issue.created_at).toLocaleDateString()}
                </div>
              </div>

              <IssueTimeline issueId={issue.id} />

              <div className="card-actions">
                <button
                  onClick={() => updateStatus(issue.id, "in_progress")}
                  className="btn-secondary"
                >
                  Start Progress
                </button>
                <button
                  onClick={() => updateStatus(issue.id, "resolved")}
                  className="btn-success"
                >
                  Mark Resolved
                </button>
              </div>

              {issue.ai_priority && (
                <div className="ai-suggestion">
                  <div className="ai-suggestion-title">AI Suggestion</div>
                  <div className="ai-suggestion-content">
                    <span>Priority: {issue.ai_priority}</span>
                    <span style={{ marginLeft: "1rem" }}>
                      Confidence: {issue.ai_confidence}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DepartmentIssues;
