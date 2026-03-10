import { useEffect, useState } from "react";
import API from "../../api/axios";

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

  if (loading) return <h2>Loading department issues...</h2>;

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

  return (
    <div style={{ padding: "20px" }}>
      <h1>Department Issues</h1>

      {issues.length === 0 && <p>No issues assigned.</p>}

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

          <div style={{ marginTop: "10px" }}>
            <button onClick={() => updateStatus(issue.id, "in_progress")}>
              Start Progress
            </button>

            <button
              onClick={() => updateStatus(issue.id, "resolved")}
              style={{ marginLeft: "10px" }}
            >
              Mark Resolved
            </button>
          </div>

          <div>Created: {new Date(issue.created_at).toLocaleString()}</div>

          {issue.ai_priority && (
            <div style={{ marginTop: "10px" }}>
              <strong>AI Suggestion</strong>
              <div>Priority: {issue.ai_priority}</div>
              <div>Confidence: {issue.ai_confidence}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default DepartmentIssues;
