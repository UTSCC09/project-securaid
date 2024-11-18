import { useState } from "react";
import { FilesUploadedNavBar } from "../FilesUploadedNavBar/FilesUploadedNavBar";
import { UploadContentComponent } from "../UploadContentComponent/UploadContentComponent";
import { DashboardComponent } from "../DashboardComponent/DashboardComponent";
import "./ContentComponent.css";

export function ContentComponent({ userId }) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <UploadContentComponent userId={userId} onUploadSuccess={handleRefresh} />
      <div id="content_container">
        <FilesUploadedNavBar userId={userId} refreshTrigger={refreshTrigger} />
        <DashboardComponent userId={userId} />
      </div>
    </>
  );
}
