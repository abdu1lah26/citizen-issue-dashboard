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
  Legend,
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

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="loading">Failed to load dashboard</div>;

  const { global_stats, department_ranking } = data;

  const chartData = {
    labels: department_ranking.map((dept) => dept.name),
    datasets: [
      {
        label: "Resolved Issues",
        data: department_ranking.map(
          (dept) => Number(dept.resolved_issues) || 0,
        ),
        backgroundColor: "rgba(37, 99, 235, 0.8)",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div>
      <div className="page-header">
        <h1>Public Dashboard</h1>
        <p>Overview of civic issues across the city</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{global_stats.total_issues}</div>
          <div className="stat-label">Total Issues</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--success)" }}>
            {global_stats.total_resolved}
          </div>
          <div className="stat-label">Resolved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: "var(--warning)" }}>
            {global_stats.total_pending}
          </div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {global_stats.avg_resolution_hours
              ? Number(global_stats.avg_resolution_hours).toFixed(1)
              : "N/A"}
          </div>
          <div className="stat-label">Avg Resolution (hrs)</div>
        </div>
      </div>

      <div className="chart-container">
        <h3 className="chart-title">Department Performance</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}

export default PublicDashboard;
