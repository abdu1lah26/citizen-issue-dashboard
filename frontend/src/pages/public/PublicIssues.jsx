import { useEffect, useState } from "react";
import API from "../../api/axios";

function PublicIssues() {
  const [issues, setIssues] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchIssues = async (pageNumber = 1) => {
    setLoading(true);
    try {
      const response = await API.get(
        `/public/issues?page=${pageNumber}&limit=10`,
      );
      setIssues(response.data.issues);
      setMeta(response.data);
      setPage(pageNumber);
    } catch (error) {
      console.error("Issues fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues(1);
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

  if (loading) return <div className="loading">Loading issues...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Public Issues</h1>
        <p>Browse all reported civic issues</p>
      </div>

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
              <div className="issue-meta-item">Dept: {issue.department_id}</div>
              <div className="issue-meta-item">
                Created: {new Date(issue.created_at).toLocaleDateString()}
              </div>
              {issue.resolved_at && (
                <div className="issue-meta-item">
                  Resolved: {new Date(issue.resolved_at).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          disabled={!meta?.has_prev}
          onClick={() => fetchIssues(page - 1)}
          className="btn-secondary"
        >
          Previous
        </button>

        <span className="pagination-info">
          Page {meta?.page} of {meta?.total_pages}
        </span>

        <button
          disabled={!meta?.has_next}
          onClick={() => fetchIssues(page + 1)}
          className="btn-secondary"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PublicIssues;
