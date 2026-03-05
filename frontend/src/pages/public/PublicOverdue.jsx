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

  if (loading) return <h2>Loading overdue issues...</h2>;

  return (
    <div style={{ padding: "20px" }}>
      <h1>Overdue Issues (SLA Breach)</h1>

      {issues.length === 0 && <p>No overdue issues currently.</p>}

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

          <div>Priority: {issue.priority}</div>
          <div>Department: {issue.department_id}</div>

          <div>
            Hours Since Created:{" "}
            {Number(issue.hours_since_created).toFixed(1)}
          </div>

          <div>
            Hours Overdue: {Number(issue.hours_overdue).toFixed(1)}
          </div>

          <div
            style={{
              color:
                issue.severity === "critical"
                  ? "red"
                  : issue.severity === "moderate"
                  ? "orange"
                  : "black",
              fontWeight: "bold",
            }}
          >
            Severity: {issue.severity}
          </div>
        </div>
      ))}
    </div>
  );
}

export default PublicOverdue;