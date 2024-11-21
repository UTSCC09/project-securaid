import "./DashboardComponent.css";

export function DashboardComponent({ scanResults }) {
  return (
    <div className="dashboard_container">
      <div className="title">Dashboard</div>
      <div className="content">
        {scanResults && scanResults.length > 0 ? (
          scanResults.map((result, index) => (
            <div key={index} className="scan-result">
              <div>
                <strong>Filename:</strong> {result.filename}
              </div>
              <div>
                <strong>Scan ID:</strong> {result.scanId}
              </div>
            </div>
          ))
        ) : (
          <div>No scan results available.</div>
        )}
      </div>
    </div>
  );
}
