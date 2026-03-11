import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import API from "../../api/axios";
import IssueTimeline from "../../components/IssueTimeline";

function IssueDetail() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await API.get(`/issues/${id}`);
        setIssue(res.data);
      } catch (err) {
        console.error("Fetch issue failed", err);
        setError(err.response?.data?.message || "Failed to load issue");
      } finally {
        setLoading(false);
      }
    };

    fetchIssue();
  }, [id]);

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

  if (loading) return <div className="loading">Loading issue details...</div>;

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Error</div>
        <p>{error}</p>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">Issue Not Found</div>
        <p>The requested issue could not be found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>{issue.title}</h1>
        <p>Issue #{issue.id}</p>
      </div>

      <div className="issue-card">
        <div className="issue-meta" style={{ marginBottom: "1rem" }}>
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
            Department: {issue.department_id}
          </div>
        </div>

        <h3 style={{ marginBottom: "0.5rem" }}>Description</h3>
        <p className="issue-description">{issue.description}</p>

        {issue.address && (
          <div style={{ marginTop: "1rem" }}>
            <strong>Address:</strong> {issue.address}
          </div>
        )}

        {issue.latitude && issue.longitude && (
          <div style={{ marginTop: "0.5rem" }}>
            <strong>Location:</strong> {issue.latitude}, {issue.longitude}
          </div>
        )}

        <div className="issue-meta" style={{ marginTop: "1.5rem" }}>
          <div className="issue-meta-item">
            Created: {new Date(issue.created_at).toLocaleString()}
          </div>
          {issue.updated_at && (
            <div className="issue-meta-item">
              Updated: {new Date(issue.updated_at).toLocaleString()}
            </div>
          )}
          {issue.resolved_at && (
            <div className="issue-meta-item">
              Resolved: {new Date(issue.resolved_at).toLocaleString()}
            </div>
          )}
        </div>

        {issue.ai_priority && (
          <div className="ai-suggestion" style={{ marginTop: "1.5rem" }}>
            <div className="ai-suggestion-title">AI Analysis</div>
            <div className="ai-suggestion-content">
              <div>
                <strong>Suggested Priority:</strong> {issue.ai_priority}
              </div>
              <div>
                <strong>Confidence:</strong> {issue.ai_confidence}
              </div>
              {issue.ai_reasoning && (
                <div>
                  <strong>Reasoning:</strong> {issue.ai_reasoning}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ marginTop: "1.5rem" }}>
          <IssueTimeline issueId={issue.id} />
        </div>
      </div>
    </div>
  );
}

export default IssueDetail;
