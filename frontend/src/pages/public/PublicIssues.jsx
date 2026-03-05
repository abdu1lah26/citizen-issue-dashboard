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
      const response = await API.get(`/public/issues?page=${pageNumber}&limit=10`);
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

  if (loading) return <h2>Loading issues...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Public Issues</h1>

      {issues.map((issue) => (
        <div
          key={issue.id}
          style={{
            border: "1px solid #ccc",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "6px",
          }}
        >
          <h3>{issue.title}</h3>
          <p>{issue.description}</p>

          <div>Status: {issue.status}</div>
          <div>Priority: {issue.priority}</div>
          <div>Department: {issue.department_id}</div>

          <div>
            Created: {new Date(issue.created_at).toLocaleString()}
          </div>

          {issue.resolved_at && (
            <div>
              Resolved: {new Date(issue.resolved_at).toLocaleString()}
            </div>
          )}
        </div>
      ))}

      <hr />

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          disabled={!meta?.has_prev}
          onClick={() => fetchIssues(page - 1)}
        >
          Previous
        </button>

        <span>
          Page {meta?.page} of {meta?.total_pages}
        </span>

        <button
          disabled={!meta?.has_next}
          onClick={() => fetchIssues(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default PublicIssues;