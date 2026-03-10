import { useState } from "react";
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
    <div style={{ padding: "20px" }}>
      <h1>Report Issue</h1>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Title"
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <br />
        <br />

        <textarea
          placeholder="Description"
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <br />
        <br />

        <input
          placeholder="Department ID"
          onChange={(e) => setForm({ ...form, department_id: e.target.value })}
        />

        <br />
        <br />

        <input
          placeholder="Latitude"
          onChange={(e) => setForm({ ...form, latitude: e.target.value })}
        />

        <br />
        <br />

        <input
          placeholder="Longitude"
          onChange={(e) => setForm({ ...form, longitude: e.target.value })}
        />

        <br />
        <br />

        <input
          placeholder="Address"
          onChange={(e) => setForm({ ...form, address: e.target.value })}
        />

        <br />
        <br />

        <input type="file" onChange={(e) => setFile(e.target.files[0])} />

        <br />
        <br />

        <button type="submit">Submit Issue</button>
      </form>

      {result && (
        <div style={{ marginTop: "30px" }}>
          <h2>AI Suggestion</h2>

          <div>Priority: {result.ai_priority}</div>
          <div>Confidence: {result.ai_confidence}</div>
          <div>Reason: {result.ai_reasoning}</div>
        </div>
      )}
    </div>
  );
}

export default ReportIssue;
