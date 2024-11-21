import { useState } from "react";
import { FilesUploadedNavBar } from "../FilesUploadedNavBar/FilesUploadedNavBar";
import { UploadContentComponent } from "../UploadContentComponent/UploadContentComponent";
import { DashboardComponent } from "../DashboardComponent/DashboardComponent";
import "./ContentComponent.css";

export function ContentComponent({ userId }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scanResults, setScanResults] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = ({
    uploadedFiles: newFiles,
    scanResults: newResults,
  }) => {
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setScanResults((prev) => [...prev, ...newResults]);
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <>
      <UploadContentComponent
        userId={userId}
        onUploadSuccess={handleUploadSuccess}
      />
      <div id="content_container">
        <FilesUploadedNavBar userId={userId} refreshTrigger={refreshTrigger} />
        <DashboardComponent scanResults={scanResults} />
      </div>
    </>
  );
}
