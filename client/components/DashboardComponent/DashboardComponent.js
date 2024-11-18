import "./DashboardComponent.css";
export function DashboardComponent({userId}) {
  return (
    <div className="dashboard_container">
      <div className="title">Dashboard</div>
      <div className="content">
        <div className="score_container">
            <div className="billboard">
                <div className="subtitle">Score</div>
            </div>
            <div className="billboard">
                <div className="subtitle">Project Progress</div>
            </div>
            <div className="billboard">
                <div className="subtitle">Type Of Vulnerabilities
                </div>
            </div>
            <div className="billboard">
                <div className="subtitle">Vulnerabilities</div>
            </div>
        </div>
      </div>
    </div>
  );
}
