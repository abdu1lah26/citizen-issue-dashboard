import { useState, useEffect } from "react";
import API from "../../api/axios";

function ReportIssue() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    department_id: "",
    latitude: "",
    longitude: "",
    address: "",
  });

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await API.get("/public/departments");
        setDepartments(res.data.departments || []);
      } catch (err) {
        console.error("Failed to fetch departments", err);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (!form.department_id) {
        alert("Please select a department");
        return;
      }

      const payload = {
        title: form.title,
        description: form.description,
        department_id: parseInt(form.department_id, 10),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        address: form.address || null,
      };

      const issueRes = await API.post("/issues", payload);

      const issue = issueRes.data.issue;

      if (file) {
        const data = new FormData();
        data.append("file", file);

        await API.post(`/issues/${issue.id}/attachments`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      setResult(issue);

      alert("Issue submitted successfully");
    } catch (err) {
      console.error(err);
      alert("Issue submission failed");
    }
  };

  return (
    <div className="form-container" style={{ maxWidth: "600px" }}>
      <div className="form-card">
        <div className="page-header">
          <h1>Report an Issue</h1>
          <p>Help us improve your community by reporting issues</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input
              placeholder="Brief title of the issue"
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Describe the issue in detail..."
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Department</label>
            <select
              value={form.department_id}
              onChange={(e) =>
                setForm({ ...form, department_id: e.target.value })
              }
              style={{ padding: "0.5rem", borderRadius: "4px", width: "100%" }}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                placeholder="e.g. 26.8467"
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                placeholder="e.g. 80.9462"
                onChange={(e) =>
                  setForm({ ...form, longitude: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              placeholder="Location address"
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attachment</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
          </div>

          <div className="form-actions">
            <button type="submit">Submit Issue</button>
          </div>
        </form>

        {result && (
          <div className="ai-suggestion">
            <div className="ai-suggestion-title">AI Analysis</div>
            <div className="ai-suggestion-content">
              <div>
                <strong>Priority:</strong> {result.ai_priority}
              </div>
              <div>
                <strong>Confidence:</strong> {result.ai_confidence}
              </div>
              <div>
                <strong>Reasoning:</strong> {result.ai_reasoning}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportIssue;
