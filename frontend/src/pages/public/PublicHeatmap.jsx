import { useEffect, useState } from "react";
import API from "../../api/axios";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
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

function PublicHeatmap() {
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const response = await API.get("/public/heatmap?precision=2");
        setClusters(response.data.clusters);
      } catch (error) {
        console.error("Heatmap fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmap();
  }, []);

  if (loading) return <div className="loading">Loading heatmap...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Issue Heatmap</h1>
        <p>Geographic distribution of reported issues</p>
      </div>

      <div className="map-container" style={{ height: "70vh" }}>
        <MapContainer
          center={[26.85, 80.95]}
          zoom={12}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {clusters.map((cluster, index) => (
            <CircleMarker
              key={index}
              center={[cluster.lat_bucket, cluster.lng_bucket]}
              radius={5 + cluster.issue_count}
              pathOptions={{
                color: "#ef4444",
                fillColor: "#ef4444",
                fillOpacity: 0.6,
              }}
            >
              <Popup>
                <strong>Issues in Area:</strong> {cluster.issue_count}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

export default PublicHeatmap;
