import { useEffect, useState } from "react";
import API from "../api/axios";

function IssueTimeline({ issueId }) {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await API.get(`/issues/${issueId}/timeline`);
        setTimeline(res.data.timeline ?? []);
      } catch (err) {
        console.error("Timeline fetch failed", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, [issueId]);

  if (loading) {
    return (
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
        Loading timeline...
      </p>
    );
  }

  if (timeline.length === 0) {
    return (
      <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
        No status updates yet.
      </p>
    );
  }

  return (
    <div className="timeline">
      <div className="timeline-title">Status Timeline</div>

      {timeline.map((item) => (
        <div key={item.id} className="timeline-item">
          <div className="timeline-status">
            {item.new_status?.replace("_", " ")}
          </div>

          {item.old_status && (
            <div className="timeline-from">
              From: {item.old_status?.replace("_", " ")}
            </div>
          )}

          <div className="timeline-date">
            {new Date(item.changed_at).toLocaleString()}
          </div>

          {item.remarks && (
            <div className="timeline-remark">Remark: {item.remarks}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default IssueTimeline;
