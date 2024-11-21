import "./DashboardComponent.css";

export function DashboardComponent({ scanResults }) {
  return (
    <div className="dashboard_container">
      <div className="title">Dashboard</div>
      <div className="content">
        {scanResults ? (
          <div>
            <strong>Scan Results:</strong>
            <pre>{JSON.stringify(scanResults, null, 2)}</pre>
          </div>
        ) : (
          <div>No scan results available.</div>
        )}
      </div>
    </div>
  );
}
