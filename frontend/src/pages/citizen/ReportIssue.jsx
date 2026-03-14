import { useState, useEffect } from "react";
import API from "../../api/axios";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to handle map clicks
function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ReportIssue() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    department_id: "",
    latitude: "",
    longitude: "",
    address: "",
  });
  // AI triage states
  const [phase, setPhase] = useState("upload"); // 'upload' | 'analyzing' | 'reviewed'
  const [aiResult, setAiResult] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    department: "",
    severity: "",
    description: "",
  });

  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [gettingLocation, setGettingLocation] = useState(false);

  // Helper: convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper: animate field fill (optional, can be replaced with direct set)
  const animateFieldFill = async (data) => {
    // Use data.data if present (backend returns { success, data })
    const ai = data.data || data;
    setFormData({
      title: "",
      category: "",
      department: "",
      severity: "",
      description: "",
    });
    await new Promise((r) => setTimeout(r, 300));
    setFormData((prev) => ({ ...prev, title: ai.title || "" }));
    await new Promise((r) => setTimeout(r, 300));
    setFormData((prev) => ({ ...prev, category: ai.category || "" }));
    await new Promise((r) => setTimeout(r, 300));
    setFormData((prev) => ({ ...prev, department: ai.department || "" }));
    await new Promise((r) => setTimeout(r, 300));
    setFormData((prev) => ({ ...prev, severity: ai.severity || "" }));
    await new Promise((r) => setTimeout(r, 300));
    setFormData((prev) => ({ ...prev, description: ai.description || "" }));
  };

  // AI triage handler
  const handleImageUpload = async (file) => {
    setPhase("analyzing"); // show loading skeleton
    const base64 = await fileToBase64(file);
    const mimeType = file.type;
    const result = await fetch("/api/analyze-issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64, mimeType }),
    });
    const data = await result.json();
    await animateFieldFill(data);
    setAiResult(data);
    setPhase("reviewed");
    // Optionally auto-fill main form
    setForm((prev) => ({
      ...prev,
      title: data.title || prev.title,
      description: data.description || prev.description,
      department_id:
        departments.find((d) => d.name === data.department)?.id ||
        prev.department_id,
    }));
  };

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

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm({
          ...form,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
        setGettingLocation(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert(
          "Unable to get your location. Please select on map or enter manually.",
        );
        setGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleMapLocationSelect = (lat, lng) => {
    setForm({
      ...form,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    });
  };

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
            <label className="form-label">Department</label>
            <select
              value={form.department_id}
              onChange={(e) =>
                setForm({ ...form, department_id: e.target.value })
              }
              required
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--text-muted)",
                marginBottom: "0.5rem",
              }}
            >
              Click on the map or use the button below to set location
            </p>

            <div
              style={{
                height: "250px",
                marginBottom: "1rem",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <MapContainer
                center={[
                  form.latitude ? parseFloat(form.latitude) : 26.85,
                  form.longitude ? parseFloat(form.longitude) : 80.95,
                ]}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <LocationPicker onLocationSelect={handleMapLocationSelect} />
                {form.latitude && form.longitude && (
                  <Marker
                    position={[
                      parseFloat(form.latitude),
                      parseFloat(form.longitude),
                    ]}
                  />
                )}
              </MapContainer>
            </div>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={gettingLocation}
              className="btn-secondary"
              style={{ marginBottom: "1rem", width: "100%" }}
            >
              {gettingLocation
                ? "Getting Location..."
                : "📍 Use My Current Location"}
            </button>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "1rem",
              }}
            >
              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>
                  Latitude
                </label>
                <input
                  value={form.latitude}
                  placeholder="Auto-filled"
                  onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value })
                  }
                  style={{ background: "#f9fafb" }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.8rem" }}>
                  Longitude
                </label>
                <input
                  value={form.longitude}
                  placeholder="Auto-filled"
                  onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value })
                  }
                  style={{ background: "#f9fafb" }}
                />
              </div>
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
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files[0];
                setFile(file);
                if (file) {
                  await handleImageUpload(file);
                }
              }}
            />
            {phase === "analyzing" && (
              <div style={{ marginTop: "0.5rem" }}>
                <div className="skeleton-field">
                  <label>Category</label>
                  <div
                    className="pulse-bar"
                    style={{
                      height: 16,
                      width: 120,
                      borderRadius: 6,
                      background: "#e5e7eb",
                      animation: "pulse 1.2s infinite",
                    }}
                  />
                </div>
                <style>{`
                  @keyframes pulse {
                    0% { opacity: 0.6; }
                    50% { opacity: 1; }
                    100% { opacity: 0.6; }
                  }
                  .pulse-bar {
                    animation: pulse 1.2s infinite;
                  }
                `}</style>
              </div>
            )}
            {phase === "reviewed" && aiResult && (
              <div className="ai-suggestion" style={{ marginTop: "1rem" }}>
                <div className="ai-suggestion-title">AI Triage Result</div>
                <div className="ai-suggestion-content">
                  {typeof aiResult.confidence === "number" &&
                    aiResult.confidence < 0.6 && (
                      <div
                        className="warning-banner"
                        style={{
                          background: "#fff3cd",
                          color: "#856404",
                          padding: "8px",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        ⚠️ AI wasn't confident about this one.
                        <br />
                        Please verify the fields before submitting.
                      </div>
                    )}
                  {typeof aiResult.confidence === "number" &&
                    aiResult.confidence >= 0.6 && (
                      <div
                        className="success-banner"
                        style={{
                          background: "#d4edda",
                          color: "#155724",
                          padding: "8px",
                          borderRadius: "6px",
                          marginBottom: "8px",
                        }}
                      >
                        ✅ AI analyzed with{" "}
                        {Math.round(aiResult.confidence * 100)}% confidence
                      </div>
                    )}
                  <div>
                    <strong>Title:</strong> {formData.title}
                  </div>
                  <div>
                    <strong>Category:</strong> {formData.category}
                  </div>
                  <div>
                    <strong>Department:</strong> {formData.department}
                  </div>
                  <div>
                    <strong>Severity:</strong> {formData.severity}
                  </div>
                  <div>
                    <strong>Description:</strong> {formData.description}
                  </div>
                </div>
              </div>
            )}
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
