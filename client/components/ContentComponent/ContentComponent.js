import { useState } from "react";
import { DashboardComponent } from "../DashboardComponent/DashboardComponent";
import { FilesUploadedNavBar } from "../FilesUploadedNavBar/FilesUploadedNavBar";
import { ShareFileComponent } from "../ShareFileComponent/ShareFileComponent";
import { UploadContentComponent } from "../UploadContentComponent/UploadContentComponent";

import "./ContentComponent.css";

export function ContentComponent({ userId }) {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [scanResults, setScanResults] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleUploadSuccess = ({
    uploadedFiles: newFiles,
    scanResults: newResults,
  }) => {
    console.log("_________-----New files uploaded----_________", newFiles);
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
