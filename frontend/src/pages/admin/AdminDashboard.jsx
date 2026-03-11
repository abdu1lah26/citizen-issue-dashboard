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

function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await API.get("/issues/dashboard/overview");
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
      {
        label: "Total Issues",
        data: department_ranking.map((dept) => Number(dept.total_issues) || 0),
        backgroundColor: "rgba(156, 163, 175, 0.5)",
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
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
        <h1>Admin Dashboard</h1>
        <p>Complete overview of all civic issues</p>
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
        <h3 className="chart-title">Department Performance Comparison</h3>
        <Bar data={chartData} options={chartOptions} />
      </div>

      <div style={{ marginTop: "2rem" }}>
        <h3 className="chart-title">Department Ranking</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--border)" }}>
              <th style={{ textAlign: "left", padding: "0.75rem" }}>Rank</th>
              <th style={{ textAlign: "left", padding: "0.75rem" }}>
                Department
              </th>
              <th style={{ textAlign: "right", padding: "0.75rem" }}>
                Resolved
              </th>
              <th style={{ textAlign: "right", padding: "0.75rem" }}>Total</th>
              <th style={{ textAlign: "right", padding: "0.75rem" }}>
                Avg Hours
              </th>
            </tr>
          </thead>
          <tbody>
            {department_ranking.map((dept, index) => (
              <tr
                key={dept.id}
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <td style={{ padding: "0.75rem" }}>{index + 1}</td>
                <td style={{ padding: "0.75rem" }}>{dept.name}</td>
                <td style={{ textAlign: "right", padding: "0.75rem" }}>
                  {dept.resolved_issues}
                </td>
                <td style={{ textAlign: "right", padding: "0.75rem" }}>
                  {dept.total_issues}
                </td>
                <td style={{ textAlign: "right", padding: "0.75rem" }}>
                  {dept.avg_resolution_hours
                    ? Number(dept.avg_resolution_hours).toFixed(1)
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
