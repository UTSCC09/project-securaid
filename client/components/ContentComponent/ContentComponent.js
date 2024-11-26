import { useState } from "react";
import { FilesUploadedNavBar } from "../FilesUploadedNavBar/FilesUploadedNavBar";
import { UploadContentComponent } from "../UploadContentComponent/UploadContentComponent";
import { DashboardComponent } from "../DashboardComponent/DashboardComponent";
import { ShareFileComponent } from "../ShareFileComponent/ShareFileComponent";
import { SharedFilesComponent } from "../SharedFilesComponent/SharedFilesComponent";

import "./ContentComponent.css";

export function ContentComponent({ username }) {
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
        userId={username}
        onUploadSuccess={handleUploadSuccess}
      />
      <div id="content_container">
        <div id="vertical-split">
          <FilesUploadedNavBar
            userId={username}
            refreshTrigger={refreshTrigger}
            onViewResults={handleViewResults}
          />
          <ShareFileComponent
            userId={username}
            refreshTrigger={refreshTrigger}
          />
          <SharedFilesComponent username={username} />
        </div>
        <DashboardComponent scanResults={scanResults} />
      </div>
    </>
  );
}
