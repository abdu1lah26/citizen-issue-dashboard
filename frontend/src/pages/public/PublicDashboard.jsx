import { useEffect, useState } from "react";
import API from "../../api/axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function PublicDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await API.get("/public/dashboard");
        setData(response.data);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <h2>Loading dashboard...</h2>;
  if (!data) return <h2>Failed to load dashboard</h2>;

  const { global_stats, department_ranking } = data;

  const chartData = {
    labels: department_ranking.map((dept) => dept.name),
    datasets: [
      {
        label: "Resolved Issues",
        data: department_ranking.map(
          (dept) => Number(dept.resolved_issues) || 0
        ),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
      },
    ],
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Public Dashboard</h1>

      <h2>Global Stats</h2>
      <p>Total Issues: {global_stats.total_issues}</p>
      <p>Resolved: {global_stats.total_resolved}</p>
      <p>Pending: {global_stats.total_pending}</p>
      <p>
        Avg Resolution Hours:{" "}
        {global_stats.avg_resolution_hours
          ? Number(global_stats.avg_resolution_hours).toFixed(2)
          : "N/A"}
      </p>

      <hr />

      <h2>Department Performance (Resolved Issues)</h2>
      <Bar data={chartData} />
    </div>
  );
}

export default PublicDashboard;