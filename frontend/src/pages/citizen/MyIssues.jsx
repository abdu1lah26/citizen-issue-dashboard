import { useEffect, useState } from "react";
import API from "../../api/axios";

function MyIssues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const res = await API.get("/issues/my");
        setIssues(res.data.issues || []);
      } catch (err) {
        console.error("Fetch issues failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchIssues();
  }, []);

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

  if (loading) return <div className="loading">Loading your issues...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>My Reported Issues</h1>
        <p>Track the status of issues you've reported</p>
      </div>

      {issues.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">No Issues Yet</div>
          <p>You haven't reported any issues yet.</p>
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
                {issue.resolved_at && (
                  <div className="issue-meta-item">
                    Resolved: {new Date(issue.resolved_at).toLocaleDateString()}
                  </div>
                )}
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

export default MyIssues;
