import { useState } from "react";
import { FilesUploadedNavBar } from "../FilesUploadedNavBar/FilesUploadedNavBar";
import { UploadContentComponent } from "../UploadContentComponent/UploadContentComponent";
import { DashboardComponent } from "../DashboardComponent/DashboardComponent";
import { ShareFileComponent } from "../ShareFileComponent/ShareFileComponent";

import "./ContentComponent.css";

export function ContentComponent({ userId }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scanResults, setScanResults] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = ({
    uploadedFiles: newFiles,
    scanResults: newResults,
  }) => {
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setScanResults(null);
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleViewResults = (results) => {
    setScanResults(results);
  };

  return (
    <>
      <UploadContentComponent
        userId={userId}
        onUploadSuccess={handleUploadSuccess}
      />
      <div id="content_container">
        <div id="vertical-split">
        <FilesUploadedNavBar
          userId={userId}
          refreshTrigger={refreshTrigger}
          onViewResults={handleViewResults}
        />
        <ShareFileComponent userId={userId}/>
        </div>
        <DashboardComponent scanResults={scanResults} />
      </div>
    </>
  );
}
