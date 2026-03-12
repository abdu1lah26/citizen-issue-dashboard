import { useEffect, useState, useMemo } from "react";
import API from "../../api/axios";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from "react-leaflet";
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

// Get color based on intensity (0-1)
const getHeatColor = (intensity) => {
  if (intensity >= 0.8) return { color: "#991b1b", fill: "#dc2626" }; // Dark red - Critical
  if (intensity >= 0.6) return { color: "#c2410c", fill: "#ea580c" }; // Orange - High
  if (intensity >= 0.4) return { color: "#ca8a04", fill: "#eab308" }; // Yellow - Medium
  if (intensity >= 0.2) return { color: "#65a30d", fill: "#84cc16" }; // Light green - Low
  return { color: "#15803d", fill: "#22c55e" }; // Green - Very Low
};

// Component to fit bounds
function FitBounds({ clusters }) {
  const map = useMap();

  useEffect(() => {
    if (clusters.length > 0) {
      const validClusters = clusters.filter(
        (c) => c.lat_bucket != null && c.lng_bucket != null,
      );
      if (validClusters.length > 0) {
        const bounds = L.latLngBounds(
          validClusters.map((c) => [
            parseFloat(c.lat_bucket),
            parseFloat(c.lng_bucket),
          ]),
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [clusters, map]);

  return null;
}

function PublicHeatmap() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [precision, setPrecision] = useState(2);

  useEffect(() => {
    const fetchHeatmap = async () => {
      setLoading(true);
      try {
        const response = await API.get(
          `/public/heatmap?precision=${precision}`,
        );
        setClusters(response.data.clusters || []);
      } catch (error) {
        console.error("Heatmap fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, [precision]);

  // Calculate stats
  const stats = useMemo(() => {
    if (clusters.length === 0) return { total: 0, max: 0, avg: 0, hotspots: 0 };

    const counts = clusters.map((c) => Number(c.issue_count));
    const total = counts.reduce((a, b) => a + b, 0);
    const max = Math.max(...counts);
    const avg = total / clusters.length;
    const hotspots = clusters.filter(
      (c) => Number(c.issue_count) >= max * 0.7,
    ).length;

    return { total, max, avg: avg.toFixed(1), hotspots };
  }, [clusters]);

  // Get max for normalization
  const maxCount = useMemo(() => {
    if (clusters.length === 0) return 1;
    return Math.max(...clusters.map((c) => Number(c.issue_count)));
  }, [clusters]);

  if (loading) return <div className="loading">Loading heatmap...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Issue Heatmap</h1>
        <p>Geographic distribution of reported issues</p>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{clusters.length}</div>
          <div className="stat-label">Areas Affected</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--danger)" }}>
            {stats.hotspots}
          </div>
          <div className="stat-label">Hotspot Zones</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.max}</div>
          <div className="stat-label">Max in Area</div>
        </div>
      </div>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <label style={{ fontWeight: 500 }}>Detail Level:</label>
          <select
            value={precision}
            onChange={(e) => setPrecision(Number(e.target.value))}
            style={{
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid var(--border)",
            }}
          >
            <option value={1}>Low (City-wide)</option>
            <option value={2}>Medium (Neighborhood)</option>
            <option value={3}>High (Street-level)</option>
          </select>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            padding: "0.5rem 1rem",
            background: "var(--card-bg)",
            borderRadius: "8px",
            border: "1px solid var(--border)",
          }}
        >
          <span style={{ fontWeight: 500, fontSize: "0.875rem" }}>
            Density:
          </span>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#22c55e",
                }}
              ></span>
              <span style={{ fontSize: "0.75rem" }}>Low</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#eab308",
                }}
              ></span>
              <span style={{ fontSize: "0.75rem" }}>Med</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#ea580c",
                }}
              ></span>
              <span style={{ fontSize: "0.75rem" }}>High</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: "#dc2626",
                }}
              ></span>
              <span style={{ fontSize: "0.75rem" }}>Critical</span>
            </span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div
        className="map-container"
        style={{
          height: "65vh",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
        }}
      >
        <MapContainer
          center={[26.85, 80.95]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {clusters.length > 0 && <FitBounds clusters={clusters} />}

          {clusters
            .filter(
              (cluster) =>
                cluster.lat_bucket != null && cluster.lng_bucket != null,
            )
            .map((cluster, index) => {
              const count = Number(cluster.issue_count);
              // Skip if no issues
              if (count === 0) return null;

              const intensity = count / maxCount;
              const colors = getHeatColor(intensity);
              const radius = Math.max(8, Math.min(25, 8 + intensity * 17));
              const lat = parseFloat(cluster.lat_bucket);
              const lng = parseFloat(cluster.lng_bucket);

              // Skip if invalid coordinates
              if (isNaN(lat) || isNaN(lng)) return null;

              return (
                <CircleMarker
                  key={index}
                  center={[lat, lng]}
                  radius={radius}
                  pathOptions={{
                    color: colors.color,
                    fillColor: colors.fill,
                    fillOpacity: 0.6 + intensity * 0.3,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div style={{ textAlign: "center", minWidth: "120px" }}>
                      <div
                        style={{
                          fontSize: "1.5rem",
                          fontWeight: "bold",
                          color: colors.color,
                          marginBottom: "4px",
                        }}
                      >
                        {count}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "#666" }}>
                        Issues in this area
                      </div>
                      <div
                        style={{
                          marginTop: "8px",
                          padding: "4px 8px",
                          background: colors.fill,
                          color: "white",
                          borderRadius: "4px",
                          fontSize: "0.75rem",
                          fontWeight: 500,
                        }}
                      >
                        {intensity >= 0.8
                          ? "CRITICAL ZONE"
                          : intensity >= 0.6
                            ? "HIGH DENSITY"
                            : intensity >= 0.4
                              ? "MODERATE"
                              : intensity >= 0.2
                                ? "LOW"
                                : "MINIMAL"}
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>

      {clusters.length === 0 && (
        <div className="empty-state" style={{ marginTop: "2rem" }}>
          <div className="empty-state-title">No Location Data</div>
          <p>No issues with location data have been reported yet.</p>
        </div>
      )}
    </div>
  );
}

export default PublicHeatmap;
