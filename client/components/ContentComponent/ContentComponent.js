import { useState } from "react";
import { FilesUploadedNavBar } from "../FilesUploadedNavBar/FilesUploadedNavBar";
import { UploadContentComponent } from "../UploadContentComponent/UploadContentComponent";
import { DashboardComponent } from "../DashboardComponent/DashboardComponent";
import "./ContentComponent.css";

export function ContentComponent({ userId }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scanResults, setScanResults] = useState(null); // Store current scan results
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = ({
    uploadedFiles: newFiles,
    scanResults: newResults,
  }) => {
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setScanResults(null); // Reset scan results to focus on new uploads
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewResults = (results) => {
    setScanResults(results); // Update the scan results for the dashboard
  };

  return (
    <>
      <UploadContentComponent
        userId={userId}
        onUploadSuccess={handleUploadSuccess}
      />
      <div id="content_container">
        <FilesUploadedNavBar
          userId={userId}
          refreshTrigger={refreshTrigger}
          onViewResults={handleViewResults}
        />
        <DashboardComponent scanResults={scanResults} />
      </div>
    </>
  );
}
