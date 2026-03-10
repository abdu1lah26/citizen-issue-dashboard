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

  if (loading) return <h2>Loading your issues...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>My Reported Issues</h1>

      {issues.length === 0 && <p>No issues reported yet.</p>}

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

          <div>Created: {new Date(issue.created_at).toLocaleString()}</div>

          {issue.resolved_at && (
            <div>Resolved: {new Date(issue.resolved_at).toLocaleString()}</div>
          )}

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

export default MyIssues;
